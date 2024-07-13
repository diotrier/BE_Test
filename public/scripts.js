document.getElementById('borrowForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const memberCode = document.getElementById('borrowMemberCode').value;
    const bookCode = document.getElementById('borrowBookCode').value;

    fetch('/borrow', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ member_code: memberCode, book_code: bookCode })
    })
        .then(response => response.text())
        .then(message => {
            document.getElementById('borrowMessage').innerText = message;
        })
        .catch(error => console.error('Error:', error));
});

document.getElementById('returnForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const memberCode = document.getElementById('returnMemberCode').value;
    const bookCode = document.getElementById('returnBookCode').value;

    fetch('/return', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ member_code: memberCode, book_code: bookCode })
    })
        .then(response => response.text())
        .then(message => {
            document.getElementById('returnMessage').innerText = message;
        })
        .catch(error => console.error('Error:', error));
});

document.getElementById('fetchBooks').addEventListener('click', function () {
    fetch('/books')
        .then(response => response.json())
        .then(books => {
            const booksList = document.getElementById('booksList');
            booksList.innerHTML = '';
            books.forEach(book => {
                const li = document.createElement('li');
                li.innerText = `${book.title} by ${book.author} (Code: ${book.code}, Stock: ${book.stock})`;
                booksList.appendChild(li);
            });
        })
        .catch(error => console.error('Error:', error));
});

document.getElementById('fetchMembers').addEventListener('click', function () {
    fetch('/members')
        .then(response => response.json())
        .then(members => {
            const membersList = document.getElementById('membersList');
            membersList.innerHTML = '';
            members.forEach(member => {
                const li = document.createElement('li');
                li.innerText = `${member.name} (Code: ${member.code}, Books Borrowed: ${member.books_borrowed})`;
                membersList.appendChild(li);
            });
        })
        .catch(error => console.error('Error:', error));
});
