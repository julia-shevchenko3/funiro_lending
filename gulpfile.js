const { src, dest, series, parallel, watch } = require("gulp");
const browserSync = require("browser-sync").create();
const fileInclude = require("gulp-file-include");
const del = require("del");
const scss = require("gulp-sass")(require('sass'));
const autoprefixer = require("gulp-autoprefixer");
const cssBeautify = require("gulp-cssbeautify");
const groupMedia = require("gulp-group-css-media-queries");
const cleanCss = require("gulp-clean-css");
const rename = require("gulp-rename");
const uglify = require("gulp-uglify-es").default;
const babel = require("gulp-babel");
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const webp = require("gulp-webp");
const webphtml = require("gulp-webp-html");
const webpcss = require("gulp-webpcss");
const ttf2woff = require("gulp-ttf2woff");
const ttf2woff2 = require("gulp-ttf2woff2");
 const plumber = require("gulp-plumber");

// Path

const srcPath = "app/";
const destPath = "dist/";

const path = {
	build: {
		html: destPath,
		css: destPath + "css/",
		js: destPath + "js/",
		images: destPath + "images/",
		fonts: destPath + "fonts/",
		json: destPath + "json/",
	},
	src: {
		html: [srcPath + "*.html", "!" + srcPath + "_*.html"],
		css: srcPath + "scss/style.scss",
		js: srcPath + "js/main.js",
		images: srcPath + "images/**/*.{jpg,png,svg,gif,ico,webp}",
		fonts: srcPath + "fonts/*.ttf",
		json:srcPath + "json/*.*",
	},
	watch: {
		html: srcPath + "**/*.html",
		css: srcPath + "scss/**/*.scss",
		js: srcPath + "js/**/*.js",
		images: srcPath + "images/**/*.{jpg,png,svg,gif,ico,webp}",
		json: srcPath + "json/*.*",
	},
	clean: "./" + destPath,
};

// Tasks

function browsersync() {
	browserSync.init({
		server: {
			baseDir: "./" + destPath,
		},
		port: 3000,
		notify: false,
		online: true,
	});
}

function json() {
	return src(path.src.json)
	.pipe(plumber())
	.pipe(dest(path.build.json));
  }

function html() {
	return src(path.src.html)
		.pipe(fileInclude())
		.pipe(webphtml())
		.pipe(dest(path.build.html))
		.pipe(browserSync.stream());
}

function css() {
	return src(path.src.css)
		.pipe(
			scss({
				outputStyle: "expanded",
			})
		)
		.pipe(groupMedia())
		.pipe(
			autoprefixer({
				cascade: true,
				overrideBrowserslist: ["last 5 versions"],
				grid: true,
			})
		)
		.pipe(webpcss())
		.pipe(cssBeautify())
		.pipe(dest(path.build.css))
		.pipe(cleanCss())
		.pipe(
			rename({
				extname: ".min.css",
			})
		)
		.pipe(dest(path.build.css))
		.pipe(browserSync.stream());
}

function js() {
	return src(path.src.js)
		.pipe(fileInclude())
		.pipe(dest(path.build.js))
		.pipe(
			babel({
				presets: ["@babel/preset-env"],
			})
		)
		.pipe(uglify())
		.pipe(
			rename({
				extname: ".min.js",
			})
		)
		.pipe(dest(path.build.js))
		.pipe(browserSync.stream());
}

function images() {
	return src(path.src.images)
		.pipe(
			webp({
				quality: 80,
			})
		)
		.pipe(dest(path.build.images))
		.pipe(src(path.src.images))
		.pipe(newer(path.build.images))
		.pipe(
			imagemin({
				progressive: true,
				svgoPlugins: [{ removeViewBox: true }],
				interlaced: true,
				optimizationLevel: 4, // 0 to 7
			})
		)
		.pipe(dest(path.build.images))
		.pipe(browserSync.stream());
}

function fonts() {
	src(path.src.fonts)
	.pipe(ttf2woff())
	.pipe(dest(path.build.fonts));
	return src(path.src.fonts)
	.pipe(ttf2woff2())
	.pipe(dest(path.build.fonts));
}
function cb() {}
function watching() {
	watch(path.watch.html, html);
	watch([path.watch.css], css);
	watch([path.watch.js], js);
	watch([path.watch.images], images);
	watch([path.watch.json], json);
}

function clean() {
	return del(path.clean);
}

const build = series(clean, parallel(html, css, js, images,fonts, json));

exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.fonts = fonts;
exports.build = build;
exports.clean = clean;
exports.json = json;
exports.default = parallel(build, watching, browsersync);