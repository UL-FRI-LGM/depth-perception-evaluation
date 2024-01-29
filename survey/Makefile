.PHONY: build
build:
	mkdir -p build/video
	mkdir -p build/images

	cp client/index.html build/index.html
	cp client/instructions.html build/instructions.html
	cp client/demographic.html build/demographic.html
	cp client/survey.html build/survey.html
	cp client/thanks.html build/thanks.html

	cp client/style.css build/style.css
	cp client/index.css build/index.css

	cp -r video build
	cp -r client/images build

	esbuild client/main.js --bundle --outdir=build --minify --sourcemap
	esbuild client/demographic.js --bundle --outdir=build --minify --sourcemap

.PHONY: serve
serve:
	mkdir -p build/video
	mkdir -p build/images

	cp client/index.html build/index.html
	cp client/instructions.html build/instructions.html
	cp client/demographic.html build/demographic.html
	cp client/survey.html build/survey.html
	cp client/thanks.html build/thanks.html

	cp client/style.css build/style.css
	cp client/index.css build/index.css

	cp -r video build
	cp -r client/images build

	esbuild client/main.js --bundle --outdir=build --minify --sourcemap --serve=3000 --servedir=build --watch
	esbuild client/demographic.js --bundle --outdir=build --minify --sourcemap --serve=3000 --servedir=build --watch
