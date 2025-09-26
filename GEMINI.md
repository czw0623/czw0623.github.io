# Gemini Project Context: Personal Website and Campaign Logger

## Project Overview

This project is a personal static website hosted on GitHub Pages. It consists of a main landing page and a dedicated, interactive web application for logging campaign progress for the "Mutant Genesis" campaign of the *Marvel Champions: The Card Game*.

The website uses plain HTML, CSS, and vanilla JavaScript. It has no backend and no build process. It recently integrated Google Identity Services for user authentication, allowing the campaign logger to save progress on a per-user basis using the browser's `localStorage`.

**Key Technologies:**
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript
*   **Authentication:** Google Identity Services for Web
*   **Data Storage:** Browser `localStorage`

**Architecture:**
*   **`index.html`**: The main landing page. It features a responsive navigation bar with a slide-out sidebar that contains navigation links and the Google Authentication UI.
*   **`styles.css`**: A single stylesheet for the entire `index.html` page, including the responsive navbar and sidebar.
*   **`index.js`**: Handles all UI interactivity on the main page, including the sidebar menu and updating the UI based on the user's authentication status.
*   **`libs/google-auth.js`**: A core, UI-agnostic library for handling Google authentication logic, such as decoding tokens, signing out, and checking login status.
*   **`marvelChampions/mg.html`**: A standalone, single-page application for the Marvel Champions campaign log. It has its own embedded styles and uses JavaScript for interactivity.
*   **`marvelChampions/mg.js`**: Handles all logic for the campaign log page (`mg.html`). This includes requiring user login, saving form data to `localStorage` scoped to the user's Google ID, and loading that data back into the form.

## Building and Running

This is a static website with no build process.

*   **Running the site:** To run the project, simply open the `.html` files in a web browser. A local web server can be used for a more realistic environment, but it's not strictly necessary.
    *   **Home Page:** Open `index.html` in a browser.
    *   **Campaign Logger:** Open `marvelChampions/mg.html` in a browser.
*   **Testing:** There are no automated tests. All testing must be done manually in the browser. The `package.json` file has a placeholder "test" script that does nothing.

## Development Conventions

*   **Authentication:** The `marvelChampions/mg.html` page is protected. It uses the `requireLogin()` function from `libs/google-auth.js` to check for a logged-in user. If the user is not logged in, they are redirected to the home page.
*   **Data Persistence:** The campaign log (`mg.js`) saves form data to `localStorage`. The key is dynamically generated based on the user's Google ID (`mutantGenesisLog_USER_ID`) to ensure data is isolated between different users on the same browser.
*   **Code Style:** The code is written in a functional style with vanilla JavaScript. There are no linters or formatters configured, but the code is generally well-commented (in Chinese).
*   **Modularity:** The JavaScript has been separated into a core auth library (`libs/google-auth.js`) and page-specific UI scripts (`index.js`, `mg.js`), which is a good practice to follow.
