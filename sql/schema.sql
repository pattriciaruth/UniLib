CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(150),
    subject VARCHAR(100),
    available BOOLEAN DEFAULT TRUE,
    isbn VARCHAR(50) UNIQUE,
    published_year INT,
    copies INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    loan_date DATE DEFAULT (CURRENT_DATE),
    due_date DATE NOT NULL,
    returned BOOLEAN DEFAULT FALSE,
    returned_at DATE NULL,
    status VARCHAR(20) DEFAULT 'borrowed'
);

CREATE TABLE reservations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE fines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    loan_id BIGINT NOT NULL,
    amount DECIMAL(6,2) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@unilib.com', '$2y$10$ZxU1nMeytH4OqI6o1kFtWe4F74rhNv8r2cH4mGpQz.F88B7eTDWmi', 'admin'),
('Librarian Jane', 'librarian@unilib.com', '$2y$10$kL0yBRGu8n7.0cPZh7ZcKe1akRJMDPv6wCD.qmyI6ATv5dcOih0.2', 'librarian'),
('Student John', 'student@unilib.com', '$2y$10$9Fd2Kc9vns1O0aAt4KQZCeFFzUvT2piYkDaOr5RrJInm2wcPK5gOu', 'student');

INSERT INTO books (title, author, subject) VALUES
('Harry Potter and the Philosopher\'s Stone', 'J.K. Rowling', 'Fantasy'),
('The Hobbit', 'J.R.R. Tolkien', 'Fantasy'),
('Introduction to Algorithms', 'Thomas H. Cormen', 'Computer Science');
