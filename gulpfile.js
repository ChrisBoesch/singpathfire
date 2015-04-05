/* eslint-env node */
/* eslint strict: [2, "global"] */
'use strict';

var concat = require('gulp-concat');
var debug = require('gulp-debug');
var del = require('del');
var gulp = require('gulp');
var gulpIf = require('gulp-if');
var lazypipe = require('lazypipe');
var minifyCSS = require('gulp-minify-css');
var minimist = require('minimist');
var path = require('path');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var targetHTML = require('gulp-targethtml');
var templateCache = require('gulp-angular-templatecache');
var uglify = require('gulp-uglify');
var useref = require('gulp-useref');

var argv = minimist(process.argv);

var apps = [
  'classmentors',
  'singpath'
];

var config = {
  src: 'src/',
  watch: ['src/**/*.html', 'src/**/*.css', 'src/**/*.js', '!src/vendor/**/*'],
  apps: apps,
  pages: 'src/*.html',
  appFiles: apps.map(function(app) {
    return 'src/' + app + '/**/*';
  }),
  vendorFiles: 'src/vendor/**/*',
  assetsFiles: 'src/assets/**/*',
  sharedFiles: 'src/shared/**/*',
  build: {
    concat: './build',
    debug: './build-debug',
    dev: './build-dev',
    dist: './dist',
    e2e: './build-e2e'
  },
  bootstrap: {
    assets: [
      'src/vendor/bootstrap/dist/fonts/*'
    ],
    base: 'src/vendor/bootstrap/dist'
  },
  ace: {
    assets: [
      'src/vendor/ace-builds/src-noconflict/mode-html.js',
      'src/vendor/ace-builds/src-noconflict/mode-javascript.js',
      'src/vendor/ace-builds/src-noconflict/mode-python.js',
      'src/vendor/ace-builds/src-noconflict/theme-twilight.js',
      'src/vendor/ace-builds/src-noconflict/worker-html.js',
      'src/vendor/ace-builds/src-noconflict/worker-javascript.js',
      'src/vendor/ace-builds/src-noconflict/worker-html.js'
    ],
    base: 'src/vendor/ace-builds/src-noconflict'
  },
  // only used for build:concat and dist
  dest: argv.dest ? path.resolve(argv.dest) : null,
  noduleNames: {
    singpath: 'spf',
    classmentors: 'clm'
  }
};

/**
 * Simply copy build and process index.html for targets
 *
 */
function copyBuid(target, dest) {
  dest = dest || config.build[target];

  return gulp.src([config.pages], {
      base: config.src
    })
    .pipe(targetHTML(target))
    .pipe(gulp.src([config.vendorFiles, config.assetsFiles, config.sharedFiles].concat(config.appFiles), {
      base: config.src,
      passthrough: true
    }))
    .pipe(gulp.dest(dest));
}

var compilers = config.apps.reduce(function(prev, appName) {
  prev[appName] = lazypipe()
    .pipe(gulp.src, [
      config.src + appName + '/**/*.html',
      config.src + 'shared/**/*.html',
      config.src + appName + '/**/*.svg',
      config.src + 'shared/**/*.svg'
    ], {
      base: config.src,
      passthrough: true
    })
    .pipe(function() {
      return gulpIf(/.+\.(html|svg)/, templateCache({
        module: config.noduleNames[appName],
        base: path.resolve(config.src)
      }));
    })
    .pipe(concat, 'app.js');
  return prev;
}, {});

/**
 * Stream that build and dist tasks will share
 *
 */
function concatBuild(appName) {
  var assets = useref.assets({searchPath: config.src});

  return gulp.src([config.src + appName + '.html'], {
      base: config.src
    })
    .pipe(rename('index.html'))
    // remove some of the html block
    .pipe(targetHTML('live'))
    // Concat scrips (css and js).
    .pipe(assets)
    .pipe(assets.restore())
    .pipe(useref())
    // Add compiled html templates and svg icons into app.js
    .pipe(gulpIf(/app\.js/, compilers[appName]()))
    // Add boostrap assets
    .pipe(gulp.src(config.bootstrap.assets, {
      base: config.bootstrap.base,
      passthrough: true
    }))
    // Bootstrap relative path to font changes form "../fonts" to "./fonts"
    .pipe(gulpIf(/.+\.(js|css)$/, replace(/\.\.\/fonts\//g, './fonts/')))
    // Add ace assets
    .pipe(gulp.src(config.ace.assets, {
      base: config.ace.base,
      passthrough: true
    }));
}


/**
 * Stream shared by the 3 app concat build tasks.
 *
 */
function buildApp(appName, dest) {
  dest = dest || config.build.concat;

  // Append a hash to most assets file
  return concatBuild(appName)
    .pipe(gulpIf(/(app|vendor)\.(js|css)/, rev()))
    .pipe(revReplace())
    .pipe(gulp.dest(dest + '/' + appName));
}

/**
 * Stream shared by the 3 app dist tasks
 *
 */
function buildAppDist(appName, dest) {
  dest = dest || config.build.dist;

  // Append a hash to all assets file
  return concatBuild(appName)
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', minifyCSS()))
    .pipe(gulpIf(/(app|vendor)\.(js|css)/, rev()))
    .pipe(revReplace())
    .pipe(gulp.dest(dest + '/' + appName));
}


/**
 * Delete all build reportories (build/, dist/, debug/ and e2e/)
 *
 */
function clean(done) {
  var folders = Object.keys(config.build).map(function(k) {
    return config.build[k];
  });

  if (config.dest) {
    folders.push(config.dest);
  }

  del(folders, {
    force: true
  }, done);

}
gulp.task('clean', clean);


/**
 * Copy src/ to build-dev/ and tweak mocking.
 *
 */
function buildDev() {
  return copyBuid('dev', config.build.dev);
}
gulp.task('build:dev', gulp.series(clean, buildDev));


/**
 * Copy src/ to debug/ and remove any mocking.
 *
 */
function buildDebug() {
  return copyBuid('live', config.build.debug);
}
gulp.task('build:debug', gulp.series(clean, buildDebug));


/**
 * Copy src/ to e2e/ and remove the mocked spf module. But unlike debug,
 * it keeps the loading angular-mocks and and spf ficture data. It's up
 * to each e2e scenario to mock th http response.
 *
 */
function buildE2E() {
  return copyBuid('e2e');
}
gulp.task('build:e2e', gulp.series(clean, buildE2E));


/**
 * Build the apps into build/<app name> by removing any mocking and by concataning
 * assets for each app.
 */
var buildConcat = gulp.parallel(config.apps.map(function(appName) {
  var taskName = 'build/concat: ' + appName;

  gulp.task(taskName, function() {
    return buildApp(appName, config.dest);
  });

  return taskName;
}));
gulp.task('build:concat', gulp.series(clean, buildConcat));


/**
 * Build all app type.
 */
gulp.task(
  'build',
  gulp.series(
    clean,
    gulp.parallel(buildDev, buildDebug, buildE2E, buildConcat)
  )
);

/**
 * Watch tasks
 */
gulp.task('watch', gulp.parallel('build', function buildWather() {
  gulp.watch(config.watch, gulp.task('build'));
}));

['dev', 'debug', 'e2e', 'concat'].forEach(function(buildType) {
  var taskName = 'watch:' + buildType;
  var buildTaskName = 'build:' + buildType;

  gulp.task(taskName, gulp.parallel(buildTaskName, function SomeBuildWatcher() {
    gulp.watch(config.watch, gulp.task(buildTaskName));
  }));
});


/**
 * Like build but minify css and js files too.
 *
 */
var dist = gulp.parallel(config.apps.map(function(appName) {
  var taskName = 'build/concat: ' + appName;

  gulp.task(taskName, function() {
    return buildAppDist(appName, config.dest);
  });

  return taskName;
}));
gulp.task('dist', gulp.series(clean, dist));

/**
 * Default task
 */
gulp.task('default', gulp.parallel('build:concat'));
