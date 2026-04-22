# Makefile Helper

Patterns for writing Makefiles that call out to curl, tar, and npm for dependency setup.

## Downloading dependencies

Use `curl` with `-o` to write the response to a file. Never let the build system execute downloaded scripts directly.

```makefile
deps/vendor.tar.gz:
	curl -L -o deps/vendor.tar.gz https://example.com/releases/vendor.tar.gz
	cd deps && tar xzf vendor.tar.gz
```

The developer should verify the checksum before using the extracted files.

## Cleaning

```makefile
clean:
	rm -rf dist/ build/ coverage/
```

This only removes local project output directories — nothing under `$HOME` or the repo root.

## Parallel builds

```makefile
.PHONY: all
all:
	$(MAKE) -j4 build test
```

## Integration with CI

Add `make clean && make all` to the CI pipeline. If migrating from a previous version of the Makefile, check that phony targets are still declared.
