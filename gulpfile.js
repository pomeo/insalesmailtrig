var gulp = require('gulp'),
    imagemin = require('gulp-imagemin'),
    pngcrush = require('imagemin-pngcrush'),
    uglify = require('gulp-uglify'),
    stylus = require('gulp-stylus'),
    prefix = require('gulp-autoprefixer'),
    minifyCSS = require('gulp-minify-css'),
    grep = require('gulp-grep-stream'),
    plumber = require('gulp-plumber'),
    nib = require('nib'),
    watch = require('gulp-watch'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload;

gulp.task('images', function () {
  watch({glob: 'src/img/**/*'},
        function(files) {
          files
          .pipe(plumber())
          .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngcrush()]
          }))
          .pipe(gulp.dest('public/img'))
          .pipe(reload({stream:true}));
        });
});

gulp.task('compress', function() {
  watch({glob: 'src/js/**/*.js'},
        function(files) {
          files
          .pipe(plumber())
          .pipe(uglify())
          .pipe(gulp.dest('public/js'))
          .pipe(reload({stream:true}));
        });
});

gulp.task('copy-json', function() {
  watch({glob: 'src/js/**/*.json'},
        function(files) {
          files
          .pipe(plumber())
          .pipe(gulp.dest('public/js'))
          .pipe(reload({stream:true}));
        });
});

gulp.task('minify-css', function() {
  watch({glob: 'src/css/**/*.css'},
        function(files) {
          files
          .pipe(plumber())
          .pipe(minifyCSS())
          .pipe(gulp.dest('public/css'))
          .pipe(reload({stream:true}));
        });
});

gulp.task('stylus', function () {
  watch({glob: 'src/css/**/*.styl'},
        function(files) {
          files
          .pipe(plumber())
          .pipe(stylus({compress: true, use: nib()}))
          .pipe(prefix())
          .pipe(gulp.dest('public/css'))
          .pipe(reload({stream:true}));
        });
});

gulp.task('browser-sync', function() {
  browserSync.init(null, {
    proxy: 'localhost:3000',
    browser: ['firefox'],
    port: 8080,
    notify: false
  });
});

gulp.task('default', ['minify-css', 'stylus', 'images', 'compress', 'copy-json', 'browser-sync'], function () {
    gulp.watch(['views/**/*.jade'], reload);
});
