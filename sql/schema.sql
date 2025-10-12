-- Create database
-- CREATE DATABASE IF NOT EXISTS unilib;
-- USE unilib;

-- =========================
-- Users Table
-- =========================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'librarian', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Books Table
-- =========================
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(150),
    subject VARCHAR(100),
    available BOOLEAN DEFAULT TRUE,
    isbn VARCHAR(50) UNIQUE,
    published_year INT,
    copies INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- =========================
-- Loans Table (Borrowing & Returns)
-- =========================
CREATE TABLE loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    loan_date DATE DEFAULT (CURRENT_DATE),
    due_date DATE NOT NULL,
    returned BOOLEAN DEFAULT FALSE,
    returned_at DATE NULL,
    status ENUM('borrowed','returned','overdue') DEFAULT 'borrowed',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);


-- =========================
-- Reservations Table
-- =========================
CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active','fulfilled','cancelled') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- =========================
-- Fines Table
-- =========================
CREATE TABLE fines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    loan_id INT NOT NULL,
    amount DECIMAL(6,2) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);
-- =========================

-- =========================
-- Sample Data
-- =========================

-- sample users
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@unilib.com', 'adminpass', 'admin'),
('Librarian Jane', 'librarian@unilib.com', 'librarianpass', 'librarian'),
('Student John', 'student@unilib.com', 'studentpass', 'student');

-- Add sample books
INSERT INTO books (title, author, subject) VALUES
('Harry Potter and the Philosopher\'s Stone', 'J.K. Rowling', 'Fantasy'),
('The Hobbit', 'J.R.R. Tolkien', 'Fantasy'),
('Introduction to Algorithms', 'Thomas H. Cormen', 'Computer Science');