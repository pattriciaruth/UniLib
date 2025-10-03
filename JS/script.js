//core frontend logic that handles user interactions, manages the display of different sections, and makes API calls to the 
document.addEventListener('DOMContentLoaded', () => {
    // DOM Element references
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const catalogueSection = document.getElementById('catalogue-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const logoutBtn = document.getElementById('logout-btn');
    const dashboardLink = document.getElementById('dashboard-link');
    const navLogin = document.getElementById('nav-login');

    // Global state variables
    let token = localStorage.getItem('token');
    let userRole = localStorage.getItem('userRole'); // Store user role for role-based access
    let bookData = []; // To store the full book list for filtering

    // --- Utility Functions ---

    /** Hides all main content sections */
    const hideAllSections = () => {
        loginSection.style.display = 'none';
        catalogueSection.style.display = 'none';
        dashboardSection.style.display = 'none';
    };

    /** Updates the visibility of UI elements based on login status */
    const updateUI = () => {
        hideAllSections();

        if (token) {
            // Logged In State
            catalogueSection.style.display = 'block'; // Default view is catalogue
            dashboardLink.style.display = 'block';
            logoutBtn.style.display = 'inline-block';
            navLogin.style.display = 'none';
            // Show Librarians/Admin a management button if role is appropriate
            if (userRole === 'librarian' || userRole === 'admin') {
                // Future: Show management links
            }
        } else {
            // Logged Out State
            loginSection.style.display = 'block';
            dashboardLink.style.display = 'none';
            logoutBtn.style.display = 'none';
            navLogin.style.display = 'inline-block';
        }
    };

    /** Switches the main view section */
    const navigateTo = (sectionId) => {
        hideAllSections();
        if (sectionId === 'catalogue') {
            catalogueSection.style.display = 'block';
            fetchBooks();
        } else if (sectionId === 'dashboard' && token) {
            dashboardSection.style.display = 'block';
            fetchDashboardData();
        } else {
            loginSection.style.display = 'block';
        }
    };

    // --- API Interaction Functions (Mocks for now, relies on your Node.js backend) ---

    /** Fetches the entire book catalogue and renders it. */
    const fetchBooks = async () => {
        const bookListContainer = document.getElementById('book-list');
        bookListContainer.innerHTML = 'Loading catalogue...';

        try {
            // This assumes your Node.js backend is running on the same host/port
            const response = await fetch('/api/books');
            if (!response.ok) throw new Error('Failed to fetch books');

            bookData = await response.json(); // Store data globally for filtering
            renderBookList(bookData);

        } catch (error) {
            console.error('Error fetching books:', error);
            bookListContainer.innerHTML = `<p style="color:red;">Error loading catalogue. Please check the backend server.</p>`;
        }
    };

    /** Renders the list of books to the catalogue section. */
    const renderBookList = (books) => {
        const bookListContainer = document.getElementById('book-list');
        bookListContainer.innerHTML = ''; // Clear existing list

        if (books.length === 0) {
            bookListContainer.innerHTML = '<p>No books found matching your criteria.</p>';
            return;
        }

        books.forEach(book => {
            const bookDiv = document.createElement('div');
            bookDiv.className = 'book-item';
            bookDiv.innerHTML = `
                <h3>${book.title}</h3>
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>ISBN:</strong> ${book.isbn}</p>
                <p><strong>Available Copies:</strong> ${book.available_copies}/${book.quantity}</p>
                <button class="reserve-btn" 
                        data-book-id="${book.book_id}" 
                        ${book.available_copies > 0 ? '' : 'disabled'}>
                    ${book.available_copies > 0 ? 'Reserve Item' : 'Out of Stock'}
                </button>
            `;
            bookListContainer.appendChild(bookDiv);

            // Attach event listener for reservation
            bookDiv.querySelector('.reserve-btn').addEventListener('click', handleReservation);
        });
    };

    /** Fetches user-specific data for the dashboard. */
    const fetchDashboardData = async () => {
        const userInfo = document.getElementById('user-info');
        userInfo.innerHTML = `Welcome back, ${localStorage.getItem('username')} (${userRole}).`;
        
        // Example: Fetch Loans
        try {
            const loansResponse = await fetch('/api/loans/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const loansData = await loansResponse.json();
            // TODO: Implement rendering of loan data in #my-loans
            document.getElementById('my-loans').innerHTML = 
                loansData.length > 0 
                ? 'Loans will be displayed here...' 
                : '<p>No active loans.</p>';
        } catch (error) {
            console.error('Error fetching loans:', error);
        }
        
        // Example: Fetch Reservations
        try {
            const reservationsResponse = await fetch('/api/reservations/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const reservationsData = await reservationsResponse.json();
            // TODO: Implement rendering of reservation data in #my-reservations
            document.getElementById('my-reservations').innerHTML = 
                reservationsData.length > 0 
                ? 'Reservations will be displayed here...' 
                : '<p>No active reservations.</p>';
        } catch (error) {
            console.error('Error fetching reservations:', error);
        }
    };

    // --- Event Handlers ---

    /** Handles the login form submission. */
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store authentication and user data
                token = data.token;
                userRole = data.user.role;
                localStorage.setItem('token', token);
                localStorage.setItem('userRole', userRole);
                localStorage.setItem('username', data.user.username);
                
                alert(`Login successful! Welcome, ${data.user.username}.`);
                updateUI();
                navigateTo('catalogue'); // Redirect to catalogue after login
            } else {
                alert(`Login failed: ${data.error}`);
            }
        } catch (error) {
            alert('A network error occurred. Is the backend running?');
            console.error('Login error:', error);
        }
    });

    /** Handles the logout process. */
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        token = null;
        userRole = null;
        alert('Logged out successfully.');
        updateUI();
    });

    /** Handles the reservation button click. */
    const handleReservation = async (e) => {
        if (!token) {
            alert('You must be logged in to make a reservation.');
            return;
        }

        const bookId = e.target.dataset.bookId;
        if (!confirm(`Do you want to reserve this book (ID: ${bookId})?`)) return;

        try {
            const response = await fetch('/api/reservations/new', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ book_id: bookId })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                fetchBooks(); // Refresh book list
            } else {
                alert(`Reservation failed: ${data.error}`);
            }
        } catch (error) {
            alert('A network error occurred.');
            console.error('Reservation error:', error);
        }
    };
    
    /** Filters the displayed books based on the search input. */
    window.filterBooks = () => {
        const query = document.getElementById('search-input').value.toLowerCase();
        const filteredBooks = bookData.filter(book => 
            book.title.toLowerCase().includes(query) || 
            book.author.toLowerCase().includes(query) || 
            book.isbn.includes(query)
        );
        renderBookList(filteredBooks);
    };

    // --- Initial Setup ---

    // Set up navigation links to change the view
    document.getElementById('nav-catalogue').addEventListener('click', () => navigateTo('catalogue'));
    dashboardLink.addEventListener('click', () => navigateTo('dashboard'));

    // Check initial state and load UI
    updateUI();
    if (token) {
        // If logged in, load catalogue immediately
        fetchBooks();
    }
});