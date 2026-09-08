# Training Data Sources

The checked-in `data/processed/dataset.csv` is a small, illustrative seed set for offline demos. It contains no captured infrastructure or private data.

For a larger model, normalize public sources into the same CSV schema:

- [PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings), organized payload references for SQL injection, XSS, command injection, LDAP injection, and path traversal.
- [SQL Injection Dataset](https://www.kaggle.com/datasets/syedsaqlainhussain/sql-injection-dataset), labeled SQL queries.
- [HTTP CSIC 2010](https://www.kaggle.com/datasets/ispangler/csic-2010-web-application-attacks), labeled normal and attack HTTP requests.

Do not commit downloaded raw datasets or credentials. Kaggle downloads require the user's own `~/.kaggle/kaggle.json`; the project does not hardcode or automatically provision credentials.
