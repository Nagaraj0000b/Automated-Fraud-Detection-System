# PlantUML Diagram Guide

## How to Use the PlantUML Code

The file `Nagaraj-Uml.puml` contains the PlantUML source code for the Automated Fraud Detection System use case diagram.

---

## Viewing the Diagram

### Option 1: Online PlantUML Editor
1. Go to [PlantUML Web Server](http://www.plantuml.com/plantuml/uml/)
2. Copy the entire content from `Nagaraj-Uml.puml`
3. Paste it into the editor
4. The diagram will render automatically

### Option 2: VS Code Extension
1. Install the **PlantUML** extension in VS Code
2. Open `Nagaraj-Uml.puml`
3. Press `Alt+D` (or use Command Palette: "PlantUML: Preview Current Diagram")
4. The diagram will render in a preview pane

### Option 3: Command Line (with PlantUML JAR)
```bash
# Install Java if not already installed
# Download plantuml.jar from https://plantuml.com/download

# Generate PNG
java -jar plantuml.jar Nagaraj-Uml.puml

# Generate SVG (scalable)
java -jar plantuml.jar -tsvg Nagaraj-Uml.puml
```

### Option 4: IntelliJ IDEA / PyCharm
1. Install PlantUML Integration plugin
2. Open the `.puml` file
3. Right-click and select "Show PlantUML Diagram"

---

## Diagram Components Explained

### Relationships in the Diagram

#### 1. **Association (Solid Line with Cardinality)**
```plantuml
Customer "1" -- "1..*" UC1 : performs
```
- **Meaning**: One customer can perform many transactions
- **Notation**: Solid line with multiplicity markers

#### 2. **Include Relationship (Dashed Arrow)**
```plantuml
UC1 .> UC2 : <<include>>
```
- **Meaning**: UC1 always includes UC2 (mandatory)
- **Notation**: Dashed arrow from base to included use case
- **Direction**: Base → Included

#### 3. **Extend Relationship (Dashed Arrow)**
```plantuml
UC9 .> UC6 : <<extend>>\n{High Risk}
```
- **Meaning**: UC9 optionally extends UC6 when condition is met
- **Notation**: Dashed arrow from extension to base
- **Direction**: Extension → Base
- **Condition**: Shown in curly braces `{High Risk}`

---

## Cardinality Reference

| Notation | Meaning |
|----------|---------|
| `1` | Exactly one |
| `0..1` | Zero or one (optional) |
| `1..*` | One or more |
| `0..*` | Zero or more |
| `*` | Many (shorthand for `0..*`) |
| `n..m` | Between n and m |

---

## Key Design Decisions

### Why These Relationships?

#### Include Relationships (6 total)
1. **Monitor Transaction → Validate Data**
   - Every transaction MUST be validated
   
2. **Validate Data → Detect Fraud**
   - All validated data MUST be checked for fraud
   
3. **Detect Fraud → Analyze Behavioral Biometrics**
   - Behavioral analysis is ALWAYS performed
   
4. **Detect Fraud → Assign Risk Score**
   - Every transaction gets a risk score
   
5. **Detect Fraud → Explain Decision (XAI)**
   - Explainability is mandatory for compliance
   
6. **Review & Label → Retrain ML Model**
   - Labeled data automatically triggers retraining

#### Extend Relationships (4 total)
1. **Trigger Alert → Assign Risk Score** `{High Risk}`
   - Alerts only when risk exceeds threshold
   
2. **Log for Manual Review → Trigger Alert**
   - Medium-risk transactions queued for review
   
3. **Freeze Account → Trigger Alert** `{Medium Risk}`
   - Account freeze for suspicious activity
   
4. **User Confirm/Reply → Trigger Alert**
   - Customer can respond to alerts

---

## Modifying the Diagram

### Adding a New Use Case
```plantuml
usecase "New Feature" as UCnew
Customer -- UCnew : uses
UCnew .> UC4 : <<include>>
```

### Adding a New Actor
```plantuml
actor "New Actor" as NewActor
NewActor "1" -- "1..*" UC1 : performs action
```

### Changing Colors (Optional)
```plantuml
' Add after @startuml
skinparam usecase {
  BackgroundColor LightBlue
  BorderColor DarkBlue
  ArrowColor Black
}
```

---

## Exporting Options

### PNG (Raster - for documents)
```bash
java -jar plantuml.jar Nagaraj-Uml.puml
# Output: Nagaraj-Uml.png
```

### SVG (Vector - for web/scaling)
```bash
java -jar plantuml.jar -tsvg Nagaraj-Uml.puml
# Output: Nagaraj-Uml.svg
```

### PDF (for presentations)
```bash
java -jar plantuml.jar -tpdf Nagaraj-Uml.puml
# Output: Nagaraj-Uml.pdf
```

---

## Compliance and Standards

This diagram follows:
- **UML 2.5 Standard** for use case diagrams
- **<<include>>** for mandatory sub-behaviors
- **<<extend>>** for optional/conditional behaviors
- **Proper cardinality notation** for associations
- **System boundary** showing internal vs external actors

---

## Common Issues and Fixes

### Issue 1: Diagram doesn't render
- **Solution**: Check for syntax errors (missing quotes, brackets)
- Use PlantUML online validator

### Issue 2: Arrows pointing wrong direction
- **Include**: Base `.>` Included (e.g., `UC1 .> UC2`)
- **Extend**: Extension `.>` Base (e.g., `UC9 .> UC6`)

### Issue 3: Overlapping elements
- **Solution**: Add spacing with `left`, `right`, `top`, `bottom`
```plantuml
usecase "UC1" as UC1
usecase "UC2" as UC2
UC1 -down-> UC2
```

---

## Version History

- **v1.0** (2026-02-03): Initial PlantUML diagram with full relationships and cardinality

---

## References

- [PlantUML Official Documentation](https://plantuml.com/use-case-diagram)
- [UML Use Case Diagram Tutorial](https://www.visual-paradigm.com/guide/uml-unified-modeling-language/what-is-use-case-diagram/)
- Project: `UML.md`, `README.md`, `RequrimentsAnalysis.md`
