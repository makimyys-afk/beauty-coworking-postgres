# Beauty Coworking

A modern web application for managing workspace bookings in a beauty coworking space.

## Features

*   **Workspace Catalog**: Filterable by categories.
*   **Booking System**: Includes QR code generation for bookings.
*   **Financial System**: Automated transactions.
*   **User Reviews**: Diverse reviews from various specialists.
*   **Admin Panel**: SQL log management.
*   **Automatic Authentication**: Mock mode for easy testing.

## Tech Stack

### Frontend

*   **React 19** + TypeScript
*   **Tailwind CSS 4** - Styling
*   **tRPC 11** - Type-safe API
*   **Wouter** - Routing
*   **shadcn/ui** - UI Components
*   **QRCode.react** - QR code generation

### Backend

*   **Node.js 22**
*   **Express 4**
*   **tRPC 11** - Type-safe API
*   **Drizzle ORM** - Database interaction
*   **PostgreSQL 14+** - Database

## Installation & Setup

### Local Development

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/makimyys-afk/beauty-coworking-postgres.git
    cd beauty-coworking-postgres
    ```

2.  **Install dependencies**:

    ```bash
    pnpm install
    ```

3.  **Configure PostgreSQL**:
    Create a database and user.

4.  **Set up environment variables**:

    ```bash
    cp .env.example .env
    ```
    Edit `.env` with your settings.

5.  **Apply migrations**:

    ```bash
    pnpm drizzle-kit migrate
    ```

6.  **Populate with test data**:

    ```bash
    node seed-complete.mjs
    node generate-reviews-diverse.mjs
    ```

7.  **Start the application**:

    ```bash
    pnpm dev
    ```

    The application will be available at `http://localhost:3000`.

## Usage

After successful installation and setup, navigate to `http://localhost:3000` in your browser. You can explore the workspace catalog, make bookings, and manage financial transactions. The administrative panel allows for SQL log monitoring. For testing purposes, you can use the following credentials:

*   **Email**: `orlova.maria@example.com`
*   **Password**: Any (mock authentication)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.