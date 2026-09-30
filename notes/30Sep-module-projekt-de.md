# Backend-Projekt zum Modulabschluss

## Projektübersicht

- Entwirf, entwickle, sichere, teste, dokumentiere und deploye eine produktionsreife REST-API.
- Wähle ein sinnvolles Problem und einen passenden Themenbereich für deine API.
- Dein Projekt soll die Backend-Kenntnisse zeigen, die du im Modul erworben hast, darunter API-Design, dauerhafte Datenspeicherung, zusammenhängende Datenmodelle, Authentifizierung und Autorisierung, Validierung, Tests und Deployment.

### Gruppen- oder Einzelarbeit?

Du kannst das Projekt allein oder in einer Gruppe bearbeiten. Wenn du in einer Gruppe arbeitest, wird von jedem Mitglied erwartet, dass es einen sinnvollen Beitrag leistet und das Design sowie die Implementierung des Projekts in einem technischen Interview erklären kann.

### Technologien?

- Du kannst die Technologien verwenden, die wir im Kurs behandelt haben.
- Du kannst auch andere oder zusätzliche Technologien einsetzen. In diesem Fall musst du bereit sein, deine Entscheidungen in einem technischen Interview zu erklären und zu begründen. Sei darauf vorbereitet, zu erläutern, warum die Technologien zum Projekt passen, welche Alternativen du in Betracht gezogen hast und welche Vor- und Nachteile deine Entscheidungen mit sich bringen.

### Lernressourcen und KI-Tools (Künstliche Intelligenz)?

- Du darfst verfügbare Lernressourcen und KI-Tools verwenden.
- Du bist dafür verantwortlich, alle eingereichten Arbeiten zu verstehen, zu testen und erklären zu können.

## Projektanforderungen

### 1. Plane die API vor der Implementierung

- Dokumentiere vor dem Bau der API ihren Zweck und ihr Design.
- Berücksichtige dabei:
  - Welches Problem löst deine API und wer soll sie verwenden?
  - Mindestens zwei zusammenhängende Entitäten und ihre Beziehungen zueinander.
  - Ein Entity-Relationship-Diagramm (ERD) oder ein gleichwertiges Datenmodelldiagramm.
  - Die geplanten Endpunkte, HTTP-Methoden und den Zweck jedes Endpunkts.
  - Beispiele für Anfrage- und Antwortformate, einschließlich Fehlerantworten.
  - Den Ansatz für Authentifizierung und Autorisierung, sofern zutreffend.
  - Deinen gewählten Technologie-Stack und eine kurze Begründung für jede wichtige Entscheidung.

### 2. Entwickle eine vollständige REST-API

- Implementiere eine zusammenhängende API für den von dir gewählten Themenbereich.
- Sie muss:
  - Eine dauerhafte Datenbank zur Speicherung und zum Abruf von Daten verwenden.
  - Mindestens zwei zusammenhängende Entitäten modellieren und ihre Beziehungen in der Datenbank und API umsetzen.
  - Für die zentralen Anwendungsfälle geeignete REST-Endpunkte bereitstellen, einschließlich Erstellen, Lesen, Aktualisieren und Löschen, soweit diese Operationen für deinen Themenbereich sinnvoll sind.
  - Geeignete HTTP-Methoden und Statuscodes verwenden sowie konsistente JSON-Antworten zurückgeben.
  - Filtern, Suchen oder Paginierung unterstützen, wenn es für deine API sinnvoll ist.
  - In klare Module mit leicht verständlichen und wartbaren Zuständigkeiten gegliedert sein.

### 3. Sichere die API

- Wende die im Modul behandelten Sicherheitspraktiken an, die für deine API relevant sind.
- Mindestens:
  - Validiere und, wo sinnvoll, bereinige nicht vertrauenswürdige Eingaben.
  - Schütze Routen und Daten, die nicht öffentlich zugänglich sein sollen.
  - Konfiguriere CORS gezielt für die Clients, die Zugriff benötigen.
  - Verwende Rate Limiting, um sensible oder missbrauchsanfällige Endpunkte zu schützen.
  - Behandle Fehler, ohne Stacktraces, Geheimnisse oder andere interne Details gegenüber API-Clients offenzulegen.
  - Verwende sichere Deployment-Einstellungen und HTTPS für die bereitgestellte API.

- Erkläre, welche Sicherheitsmaßnahmen für dein Design nicht relevant sind, und begründe diese Entscheidung.

### 4. Teste und dokumentiere die API

- Schreibe automatisierte Tests für wichtiges Verhalten, darunter erfolgreiche Anfragen, ungültige Eingaben und relevante Autorisierungs- oder Fehlerfälle.
- Dokumentiere, wie das Projekt lokal installiert, konfiguriert, getestet und ausgeführt wird.
- Dokumentiere die API-Endpunkte mit Beispielen für Anfragen und Antworten, einschließlich erwarteter Fehlerfälle.
- Füge den Projektplan und das Datenmodelldiagramm zum Repository hinzu oder verlinke sie in der README-Datei.
- Stelle sicher, dass andere Entwickler:innen der Dokumentation folgen und die API ausprobieren können.

### 5. Stelle das Backend bereit

- Stelle die API so bereit, dass die Lehrkraft darauf zugreifen kann.
- Überprüfe, ob der bereitgestellte Dienst korrekt startet und die dokumentierten Endpunkte funktionieren.
- Füge die URL des laufenden Backends deiner Abgabe und README-Datei hinzu.
- Veröffentliche keine Zugangsdaten oder vertraulichen Konfigurationswerte im Repository oder in der Dokumentation.

## Definition of Done

Das Projekt ist abgeschlossen, wenn:

- Die API einen klar beschriebenen Anwendungsfall abdeckt und mindestens zwei zusammenhängende Entitäten enthält.
- Zentrale Daten dauerhaft gespeichert werden und die API die relevanten Erstell-, Lese-, Aktualisierungs- und Löschoperationen unterstützt.
- Die API getestet wurde und die wichtigen Sicherheitsmaßnahmen umgesetzt und erklärt sind.
- Das Projekt so dokumentiert ist, dass andere Entwickler:innen es einrichten und die API verwenden können.
- Das Backend bereitgestellt wurde, die Live-URL funktioniert und mit der Lehrkraft geteilt wurde.
- Alle Teilnehmenden die Architektur, das Datenmodell, die Endpunkte, die Sicherheitsentscheidungen, die Tests, das Deployment und ihren eigenen Beitrag erklären können.

## Tägliche Projekt-Updates

- Ab **Mittwoch, dem 30. September 2026**, muss jede teilnehmende Person oder Projektgruppe der Lehrkraft **JEDEN TAG** während des gesamten Projektzeitraums die folgenden Updates per Slack-Direktnachricht schicken.

- Jede teilnehmende Person muss ein eigenes Update schicken, auch wenn sie Teil einer Gruppe ist.
- Gruppenmitglieder können sich bei ihrem Update abstimmen; es muss jedoch klar erkennbar sein, für welche teilnehmenden Personen es gilt.

### TLP zwischen 9:00 und 10:00 Uhr: Planung und Risikoeinschätzung (proaktiv)

Schicke:

1. Deine drei wichtigsten Aufgaben, die du für den Tag planst.
2. Das offensichtlichste Hindernis oder Risiko für diesen Plan.
3. Wie du dieses Risiko vermeiden, verringern oder beheben willst.

### Nach der ILP (spätestens um 23:59 Uhr): Fortschritt und nächster Schritt

Schicke dieses Update:

1. Drei oder mehr Aufgaben, die du an diesem Tag tatsächlich abgeschlossen hast.
2. Deine wichtigste Erkenntnis des Tages.
3. Deine höchste Priorität für morgen.

Formuliere die Updates konkret und ehrlich. Wenn eine geplante Aufgabe blockiert wurde oder nicht abgeschlossen werden konnte, erwähne das und beschreibe den nächsten Schritt.

## Endgültige Abgabefrist

- Gib das vollständige Projekt bis **Montag, den 19. Oktober 2026, um 23:59 Uhr** ab.

## Abzugeben

- Einen Link zum GitHub-Repository mit dem Projektcode. Wenn du in einer Gruppe arbeitest, sollte jedes Gruppenmitglied denselben Projektcode im eigenen privaten Repository haben.
- Eine README-Datei im Repository mit:
  - Einer kurzen Beschreibung der API und ihres Zwecks.
  - Einer Dokumentation der API-Endpunkte einschließlich Anfrage- und Antwortbeispielen.
  - Den Namen aller am Projekt beteiligten Teammitglieder.
  - Anleitungen zum Einrichten und Ausführen des Projekts, Hinweisen zur relevanten Konfiguration sowie Links zum Projektplan und Datenmodelldiagramm.
  - Der URL des bereitgestellten Backends.
- Den Link zum bereitgestellten Backend, geteilt mit der Lehrkraft.
- Die täglichen Projekt-Updates, die während des gesamten Projektzeitraums per Slack-Direktnachricht verschickt wurden.

## Unterstützung durch die Lehrkraft

- Regel Nr. 1: Es gibt keine dummen Fragen. Wenn du bei etwas unsicher bist, frage nach.
- Die Lehrkraft steht während des Projektzeitraums für Fragen und Unterstützung zur Verfügung.
- Bei dringenden Problemen kannst du dich auch per Slack-Direktnachricht oder über Google Meet an die Lehrkraft wenden. Bleib nicht zu lange an einem Problem hängen, ohne Hilfe zu suchen. Die Lehrkraft hilft dir gern bei der Fehlersuche, damit du weiterarbeiten kannst.
