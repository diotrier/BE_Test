const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'library'
});

// Swagger setup
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'BE_TEST_API',
            version: '1.0.0',
            description: 'Booking Book API'
        }
    },
    apis: ['./index.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /members:
 *  get:
 *    description: Get all members
 *    responses:
 *      200:
 *        description: Success
 */
app.get('/members', (req, res) => {
    db.query('SELECT * FROM members', (err, results) => {
        if (err) throw err;
        res.send(results);
    });
});

/**
 * @swagger
 * /books:
 *  get:
 *    description: Get all books
 *    responses:
 *      200:
 *        description: Success
 */
app.get('/books', (req, res) => {
    db.query('SELECT * FROM books WHERE stock > 0', (err, results) => {
        if (err) throw err;
        res.send(results);
    });
});

/**
 * @swagger
 * /borrow:
 *  post:
 *    description: Borrow a book
 *    parameters:
 *      - name: member_code
 *        description: Member code
 *        required: true
 *        type: string
 *      - name: book_code
 *        description: Book code
 *        required: true
 *        type: string
 *    responses:
 *      200:
 *        description: Success
 */
app.post('/borrow', (req, res) => {
    const { member_code, book_code } = req.body;

    db.query('SELECT * FROM members WHERE code = ?', [member_code], (err, memberResults) => {
        if (err) throw err;
        const member = memberResults[0];

        if (new Date() < new Date(member.penalty_until)) {
            return res.status(400).send('Member is currently being penalized');
        }

        db.query('SELECT * FROM borrowings WHERE member_code = ?', [member_code], (err, borrowingResults) => {
            if (err) throw err;

            if (borrowingResults.length >= 2) {
                return res.status(400).send('Member cannot borrow more than 2 books');
            }

            db.query('SELECT * FROM books WHERE code = ? AND stock > 0', [book_code], (err, bookResults) => {
                if (err) throw err;

                if (bookResults.length === 0) {
                    return res.status(400).send('Book is not available');
                }

                db.query('INSERT INTO borrowings (member_code, book_code, borrow_date) VALUES (?, ?, NOW())', [member_code, book_code], (err) => {
                    if (err) throw err;

                    db.query('UPDATE books SET stock = stock - 1 WHERE code = ?', [book_code], (err) => {
                        if (err) throw err;
                        res.send('Book borrowed successfully');
                    });
                });
            });
        });
    });
});

/**
 * @swagger
 * /return:
 *  post:
 *    description: Return a book
 *    parameters:
 *      - name: member_code
 *        description: Member code
 *        required: true
 *        type: string
 *      - name: book_code
 *        description: Book code
 *        required: true
 *        type: string
 *    responses:
 *      200:
 *        description: Success
 */
app.post('/return', (req, res) => {
    const { member_code, book_code } = req.body;

    db.query('SELECT * FROM borrowings WHERE member_code = ? AND book_code = ?', [member_code, book_code], (err, borrowResults) => {
        if (err) throw err;

        if (borrowResults.length === 0) {
            return res.status(400).send('Book not borrowed by this member');
        }

        const borrowDate = new Date(borrowResults[0].borrow_date);
        const returnDate = new Date();
        const diffDays = Math.ceil((returnDate - borrowDate) / (1000 * 60 * 60 * 24));

        let penaltyQuery = '';
        if (diffDays > 7) {
            penaltyQuery = ', penalty_until = DATE_ADD(NOW(), INTERVAL 3 DAY)';
        }

        db.query(`UPDATE members SET penalty_until = CASE WHEN '${penaltyQuery}' THEN NOW() ELSE penalty_until END WHERE code = ?`, [member_code], (err) => {
            if (err) throw err;

            db.query('DELETE FROM borrowings WHERE member_code = ? AND book_code = ?', [member_code, book_code], (err) => {
                if (err) throw err;

                db.query('UPDATE books SET stock = stock + 1 WHERE code = ?', [book_code], (err) => {
                    if (err) throw err;
                    res.send('Book returned successfully');
                });
            });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
