# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is **SuiteCRM 7.14.6**, a PHP-based open-source CRM application (LAMP stack). It requires PHP 8.1+, MariaDB/MySQL, and Composer for dependencies.

### Services

| Service | Command | Notes |
|---------|---------|-------|
| Web server | `php -d display_errors=0 -d error_reporting="E_ALL & ~E_DEPRECATED & ~E_STRICT" -S localhost:8080 /workspace/router.php` | Uses `router.php` to handle URL rewriting (API routes, static files) since PHP's built-in server doesn't support `.htaccess` |
| MariaDB | `sudo service mariadb start` | Must be started before the web server; database `suitecrm` with root access (no password) |

### Running Tests

- **PHPUnit (unit tests):** `./vendor/bin/phpunit --configuration ./tests/phpunit.xml.dist ./tests/unit/phpunit/lib --no-coverage`
- **PHPUnit (module tests):** `./vendor/bin/phpunit --configuration ./tests/phpunit.xml.dist ./tests/unit/phpunit/modules/<ModuleName> --no-coverage`
- **Codeception (acceptance/API):** `./vendor/bin/codecept run` (requires full web server + database setup)
- **Note:** Running all module tests at once hits a fatal error in `include/Imap/ImapHandlerFake.php` due to a PHP 8.1 interface incompatibility. Run specific module test directories to avoid this.

### Lint / Static Analysis

- **php-cs-fixer:** `PHP_CS_FIXER_IGNORE_ENV=1 ./vendor/bin/php-cs-fixer fix --dry-run --diff` (requires `PHP_CS_FIXER_IGNORE_ENV=1` for PHP 8.1+)
- **PHPStan:** `./vendor/bin/phpstan analyse --memory-limit=512M lib/` (no phpstan.neon config exists; pass directories explicitly)

### Authentication

- **Web login:** POST to `index.php` with fields `user_name`, `username_password` (note: field name is `username_password`, not `user_password`), `module=Users`, `action=Authenticate`
- **API (JSON API v8):** OAuth2 password grant at `/Api/access_token` with client_id `suitecrm_client`, client_secret `secret`, username `admin`, password `admin123`
- **Password hashing:** SuiteCRM uses `password_hash(strtolower(md5($plaintext)), PASSWORD_DEFAULT)` — to reset a password in the DB, generate the hash accordingly
- **OAuth2 client secret:** Stored as `hash('sha256', $clientSecret)` in the `oauth2clients` table

### Key Gotchas

- The `router.php` file in the repo root is required for the PHP built-in dev server. It routes `/Api/*` requests to `Api/index.php` and serves static files directly.
- OAuth2 keys must exist at `Api/V8/OAuth2/private.key` and `Api/V8/OAuth2/public.key` (generated with `openssl genrsa` / `openssl rsa -pubout`).
- The `config_si.php` file triggers silent installation mode — remove it after install is complete to prevent re-running the installer.
- MariaDB root user must use `mysql_native_password` or empty password for PHP to connect without socket auth issues.
