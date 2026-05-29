import chalk from 'chalk';
import debug from 'debug';
import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import crypto from 'crypto';

// Create a debug instance for our app
const log = debug('app:hello');
// Enable debug output
debug.enable('app:*');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// VULNERABILITY 1: Hard-coded credentials (CWE-798)
const DATABASE_PASSWORD = 'super_secret_password_123';
const API_KEY = 'sk-1234567890abcdef';
const JWT_SECRET = 'my-secret-key';
const AWS_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

// VULNERABILITY 2: Weak cryptographic algorithm (CWE-327)
function hashPassword(password) {
    return crypto.createHash('md5').update(password).digest('hex');
}

// Use chalk to colorize the Hello World message
console.log(chalk.blue.bold('=== Hello World Application ==='));
console.log(chalk.green('Hello, World!'));
console.log(chalk.yellow('This message uses chalk for colors!'));

// VULNERABILITY 3: SQL Injection (CWE-89)
app.get('/user', (req, res) => {
    const userId = req.query.id;
    // Vulnerable: user input directly concatenated into SQL query
    const query = `SELECT * FROM users WHERE id = '${userId}'`;
    log(chalk.red('Executing query: ' + query));
    res.json({ query: query });
});

// VULNERABILITY 4: Command Injection (CWE-78)
app.get('/ping', (req, res) => {
    const host = req.query.host;
    // Vulnerable: user input passed directly to shell command
    exec(`ping -c 4 ${host}`, (error, stdout, stderr) => {
        if (error) {
            log(chalk.red(`Error: ${error.message}`));
            return res.status(500).send(error.message);
        }
        res.send(stdout);
    });
});

// VULNERABILITY 5: Path Traversal (CWE-22)
app.get('/file', (req, res) => {
    const filename = req.query.name;
    // Vulnerable: no path validation, allows ../../../etc/passwd
    const filepath = `/var/www/files/${filename}`;
    fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).send('File not found');
        }
        res.send(data);
    });
});

// VULNERABILITY 6: Cross-Site Scripting (XSS) (CWE-79)
app.get('/welcome', (req, res) => {
    const name = req.query.name;
    // Vulnerable: user input rendered without sanitization
    res.send(`<h1>Welcome ${name}!</h1>`);
});

// VULNERABILITY 7: Insecure Random Number Generation (CWE-338)
function generateToken() {
    // Vulnerable: Math.random() is not cryptographically secure
    return Math.random().toString(36).substring(2);
}

// VULNERABILITY 8: Regular Expression Denial of Service (ReDoS) (CWE-1333)
app.post('/validate', (req, res) => {
    const input = req.body.data;
    // Vulnerable: catastrophic backtracking regex
    const emailRegex = /^([a-zA-Z0-9]+)*@([a-zA-Z0-9]+)*\.com$/;
    const isValid = emailRegex.test(input);
    res.json({ valid: isValid });
});

// VULNERABILITY 9: Missing input validation
app.post('/update-age', (req, res) => {
    const age = req.body.age;
    // Vulnerable: no type checking or validation
    const nextYear = age + 1;
    res.json({ nextYearAge: nextYear });
});

// VULNERABILITY 10: Information exposure in error messages
app.get('/login', (req, res) => {
    const username = req.query.username;
    const password = req.query.password;

    // Vulnerable: reveals whether username exists
    if (username !== 'admin') {
        return res.status(401).send('Username does not exist in our system');
    }

    if (password !== DATABASE_PASSWORD) {
        return res.status(401).send('Password is incorrect');
    }

    res.send('Login successful');
});

// Use debug for logging
log('Application started successfully');
log(chalk.magenta('Debug and chalk work great together!'));

// VULNERABILITY 11: Insecure server configuration
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(chalk.cyan(`\n✓ Server running on http://0.0.0.0:${PORT}`));
    console.log(chalk.yellow(`Database password: ${DATABASE_PASSWORD}`)); // Vulnerable: logging secrets
    console.log(chalk.yellow(`API Key: ${API_KEY}`));
});

console.log(chalk.cyan('\n✓ Application completed'));
