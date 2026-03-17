# UI Choice for Automated Fraud Detection System

## Selected UI Type

We use a **web-based graphical user interface (GUI)** that combines a **menu-based interface** with a **direct manipulation interface**.

Concretely, the system is implemented as a modern web application (using React) with:
- Navigation sidebars and menus
- Clickable cards, buttons, tables, and charts
- Forms and dropdowns for key operations

## Justification for This Choice

1. **Suitable for non-technical users**  
   The primary users (analysts, risk officers, compliance staff, and managers) are not expected to type commands or scripts. A graphical, menu-driven dashboard with clear labels and icons is much easier to learn and use than a command-line interface.

2. **Better for complex, data‑heavy tasks**  
   Fraud detection involves monitoring large numbers of transactions, viewing risk scores, and analyzing patterns. Tables, charts, and visual indicators on dashboards communicate this information far more effectively than plain text output.

3. **High learnability and discoverability**  
   Menu-based navigation and visible buttons make available actions obvious: users can directly see options such as *Transaction Monitoring*, *Fraud Analytics*, *User Management*, and *System Settings* without memorizing commands.

4. **Direct manipulation of domain objects**  
   Users interact directly with domain objects (e.g., transactions, users, risk rules) via clickable rows, action buttons, and dialogs. This direct manipulation interface makes it clear what is being acted upon and provides immediate visual feedback.

5. **Error prevention and safety**  
   Forms, dropdowns, input validation, and confirmation dialogs reduce the risk of critical mistakes when adding users, changing risk rules, or managing models. A command-based UI is more prone to syntactic and typing errors.

6. **Real-time monitoring and feedback**  
   Dashboards can present real-time status, alerts, and KPIs (e.g., number of flagged transactions, fraud rate, model performance) using colors, badges, and charts, which is essential in an automated fraud detection context.

7. **Responsiveness and accessibility**  
   A web GUI can be made responsive to different screen sizes (laptops, desktops, large displays) and can incorporate accessibility features (contrast, font size, keyboard navigation), improving usability compared to a pure command-line or text interface.

Overall, a **web-based graphical, menu-driven direct manipulation interface** provides the best balance of usability, safety, and efficiency for the stakeholders of the Automated Fraud Detection System.