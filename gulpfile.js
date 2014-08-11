var gulp = require('gulp'),
    imagemin = require('gulp-imagemin'),
    pngcrush = require('imagemin-pngcrush'),
    uglify = require('gulp-uglify'),
    stylus = require('gulp-stylus'),
    prefix = require('gulp-autoprefixer'),
    minifyCSS = require('gulp-minify-css'),
    nib = require('nib'),
    watch = require('gulp-watch'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload;

gulp.task('images', function () {
  gulp.src('src/img/**/*')
  .pipe(watch(function(files) {
          return files.pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngcrush()]
          }))
                 .pipe(gulp.dest('public/img'))
                 .pipe(reload({stream:true}));
        }));
});

gulp.task('compress', function() {
  gulp.src('src/js/**/*.js')
  .pipe(watch(function(files) {
          return files.pipe(uglify())
                 .pipe(gulp.dest('public/js'))
                 .pipe(reload({stream:true}));
        }));
});

gulp.task('minify-css', function() {
  gulp.src('src/css/**/*.css')
  .pipe(watch(function(files) {
          return files.pipe(minifyCSS())
                 .pipe(gulp.dest('public/css'))
                 .pipe(reload({stream:true}));
        }));
});

gulp.task('stylus', function () {
  gulp.src('src/css/**/*.styl')
  .pipe(watch(function(files) {
          return files.pipe(stylus({compress: true, use: nib()}))
                 .pipe(prefix())
                 .pipe(gulp.dest('public/css'))
                 .pipe(reload({stream:true}));
        }));
});

gulp.task('browser-sync', function() {
  browserSync.init(null, {
    proxy: 'localhost:3000',
    browser: ['google-chrome'],
    notify: false
  });
});

gulp.task('default', ['minify-css', 'stylus', 'images', 'compress', 'browser-sync'], function () {
    gulp.watch(['views/**/*.jade'], reload);
});
