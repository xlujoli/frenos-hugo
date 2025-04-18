# Frenos Hugo

Frenos Hugo is a brake mechanic workshop application designed to manage car details, services performed, and consultations based on license plates. This application provides a user-friendly interface for mechanics to input and retrieve information efficiently.

## Project Structure

```
frenos-hugo
├── public
│   ├── index.html        # Main entry point for the application
│   ├── cars.html        # Page for entering car details
│   ├── services.html     # Page for logging services performed
│   └── consultation.html  # Page for consulting services by license plate
├── src
│   ├── app.js            # Initializes the application and sets up middleware
│   ├── controllers       # Contains controllers for handling business logic
│   │   ├── carsController.js
│   │   ├── servicesController.js
│   │   └── consultationController.js
│   ├── models            # Contains data models for cars and services
│   │   ├── car.js
│   │   └── service.js
│   ├── routes            # Contains route definitions for the application
│   │   ├── carsRoutes.js
│   │   ├── servicesRoutes.js
│   │   └── consultationRoutes.js
│   └── views             # Contains EJS templates for rendering pages
│       ├── cars.ejs
│       ├── services.ejs
│       └── consultation.ejs
├── package.json          # Configuration file for npm
├── README.md             # Documentation for the project
└── server.js             # Entry point for the server
```

## Features

- **Car Management**: Add and manage car details including license plate, brand, model, owner, and phone number.
- **Service Logging**: Log services performed on cars, including validation to prevent duplicate entries based on license plates.
- **Consultation**: Retrieve and display services performed on a specific car using its license plate.

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd frenos-hugo
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```

## Usage

- Access the application through your web browser at `http://localhost:3000`.
- Use the Cars page to input new car details.
- Use the Services page to log services performed on cars.
- Use the Consultation page to view services by entering the car's license plate.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License.