<?php
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// API routes
if (preg_match('#^/Api/access_token#', $path) || preg_match('#^/Api/V8/#', $path)) {
    $_SERVER['SCRIPT_NAME'] = '/Api/index.php';
    require __DIR__ . '/Api/index.php';
    return true;
}

// Deprecated API routes
if (preg_match('#^/api/(.*)#', $path)) {
    require __DIR__ . '/lib/API/public/index.php';
    return true;
}

// JS language cache
if (preg_match('#^/cache/jsLanguage/(..)_(..).js$#', $path, $m)) {
    $_GET['entryPoint'] = 'jslang';
    $_GET['modulename'] = 'app_strings';
    $_GET['lang'] = $m[1] . '_' . $m[2];
    require __DIR__ . '/index.php';
    return true;
}

// Static files
if (file_exists(__DIR__ . $path) && !is_dir(__DIR__ . $path)) {
    return false;
}

// Default to index.php
require __DIR__ . '/index.php';
return true;
