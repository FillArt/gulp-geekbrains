const { src, dest, watch, parallel, series } = require('gulp');

// -----------------------------------------------------------------

// Список интересных модулей, находиться здесь :)
const scss          = require('gulp-sass'),
    pug             = require('gulp-pug'),  // Для работы с PUG.
    cssnano         = require('cssnano'),   // Для минификации CSS.
    concat          = require('gulp-concat'),   // Для объединения файлов и переименования
    browserSync     = require('browser-sync').create(), // Перезагрузка браузера
    uglify          = require('gulp-uglify-es').default,  // Минификатор JS
    imagemin        = require('gulp-imagemin'), // Сжатие картинок
    webp            = require('gulp-webp'), // Конвертация карток в WEBP
    postcss         = require('gulp-postcss'),  // POST CSS
    autoprefixer    = require('autoprefixer'),  // Добавление вендорных префексов для старых браузеров
    plumber         = require('gulp-plumber'),  // Красивый индикатор ошибок.
    prettify        = require('gulp-html-prettify'),  // Форматер HTML
    autopolyfiller  = require('gulp-autopolyfiller');   // Добавление полифилов для js
    purgecss        = require('@fullhuman/postcss-purgecss'),  // Удаление неиспользуемых свойств CSS.
    gcmq            = require('gulp-group-css-media-queries') // Группировка медиазапросов и их оптимизация.
    del             = require('del');   // Удаление.

// -----------------------------------------------------------------

// PUG
const pugTemplate = function() {
    return src('app/pug/*.pug') // Получаем файлы PUG
        .pipe(pug({pretty: true}))  // Красиво форматирую и перевожу в HTML.
        .pipe(prettify({indent_char: ' ', indent_size: 2})) // Правила форматирования
        .pipe(dest('app'))
        .pipe(browserSync.reload({stream: true}));
}

// SCSS
const styles = function() {
    let plugins = [ 
        autoprefixer({browsers: ['last 8 version'], grid: true}),
        purgecss({content: ['app/*.html'],  safelist: [/slick/, /button$/, /mfp/]}), // Очистка от неиспользуемых css правил (Очиста от мусора)
        cssnano() // Минификация css
    ]
    return src('app/scss/style.scss')
        .pipe(plumber()) // Удобный интерфейс обработки ошибок.
        .pipe(scss({outputStyle: 'compressed'}))  // Минифицированный CSS
        .pipe(postcss(plugins)) // Подключаем плагины для post css
        .pipe(concat('style.min.css'))  // Переименоваваем
        .pipe(gcmq())   // Группирую медиазапросы (Крутая штука)
        .pipe(dest('app/css'))
        .pipe(browserSync.reload({stream: true}));
}

// Working with css libraries.
const stylesLibs = function() {
    return src([
        // Как пример подключения сторонних бибилотек сss
        // 'node_modules/normalize.css/normalize.css',
        'app/scss/lib.scss'
    ])
        .pipe(plumber())
        .pipe(concat('_libs.scss'))
        .pipe(dest('app/scss/modules'))
        .pipe(browserSync.reload({stream: true}))
}

// JavaScript
const scripts = function() {
    return src([
        'node_modules/jquery/dist/jquery.js',  // Jquery
        'app/js/main.js',
    ])
        .pipe(plumber())
        .pipe(concat('main.min.js'))
        // .pipe(autopolyfiller('main.min.js'))
        .pipe(uglify()) // Минификация.
        .pipe(dest('app/js'))
        .pipe(browserSync.reload({stream: true}));
}

// Images
const images = function() {
    return src('app/images/**/*')
        .pipe(plumber())
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        // .pipe(webp()) - Конвертация в WebP, то о чем я говорил на вебинаре.
        .pipe(dest('dist/images'))
}

// -----------------------------------------------------------------


// Reload Browser
const browsersync = function() {
    browserSync.init({
        server: {
            baseDir: "app/"
        }
    })
}

// Creating a build for the customer.
const build = function() {
    return src([
        'app/*html',
        'app/css/style.min.css',
        'app/js/main.min.js',
        'app/fonts/**/*.*',
    ], {base: 'app'})
    .pipe(dest('dist'))
}

// Clean Dist
function cleanDist() {
    return del('dist')
}

// Watch
const watching = function() {
    watch(['app/pug/**/*.pug'], pugTemplate)
    watch(['app/scss/**/*.scss'], styles)
    watch(['app/js/main.js'], scripts)
}

// User script.
exports.default = parallel(scripts, pugTemplate, stylesLibs, styles, browsersync, watching);
exports.build = series(cleanDist, build);
exports.images = series(images);