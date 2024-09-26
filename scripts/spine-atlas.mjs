function Atlas() {};

Atlas.prototype.parse = (data) => {
    const pages = [];
    let page = {};
    let regions = null;
    let state = 0;

    for (const line of data.split('\n')) {
        if (line.trim().length === 0) {
            if (state > 0) {
                if (regions) {
                    page.regions.push(regions);
                    regions = null;
                }

                pages.push(page);
            }

            state = 0;

            continue;
        }

        switch (state) {
            case 0: // new page
                state = 1;
                page = {
                    file: line.trim(),
                    regions: [],
                };

                break;
            case 1: // page option or new regions block
                if (line.includes(':')) {
                    let [optName, optVal] = line.split(':')
                    page[optName.trim()] = optVal.split(',').map(x => parseType(x.trim()))
                } else {
                    regions = {
                        name: line.trim(),
                    };

                    state = 2;
                }

                break;
            case 2: // region block option or new regions block
                if (line.includes(':')) {
                    let [optName, optVal] = line.split(':')
                    regions[optName.trim()] = optVal.split(',').map(x => parseType(x.trim()))
                } else {
                    page.regions.push(regions);
                    regions = {
                        name: line.trim(),
                    };
                }

                break;
        }
    }

	function parseType(x) {
		const types = {
			true: true,
			false: false,
			[Number(x)]: Number(x)
		};

		if (types[x] === undefined) return x;
		return types[x];
	}

    return pages;
};

Atlas.prototype.stringify = (pages) => {
	let data = '';

	for (const page of pages) {
		// default property preset
		// used to retain correct prop ordering, and filtering newly added props
		const optNames = ['file', 'size', 'format', 'filter', 'repeat', 'regions'];
		const allOpts = Object.keys(page);
		const newOpts = allOpts.filter(opt => !optNames.includes(opt));

		// exclude specials from iteration
		optNames.shift();
		optNames.pop();

		// append newly added options
		for (const opt of newOpts) {
			optNames.push(opt);
		}

		// stringify metadata
		data += `\n${page.file}\n`;
		for (const opt of optNames) {
			data += `${opt}: ${page[opt]}\n`;
		};

		// stringify spritesheet
		let regions = '';
		for (const sprite of page.regions) {
			for (const optName of Object.keys(sprite)) {
				if (optName === 'name') {
					regions += `${sprite[optName]}\n`;
					continue;
				}
				regions += `  ${optName}: ${sprite[optName]}\n`;
			}
		};

		data += regions;
	}

	return data;
}

const atlas = new Atlas();

export {
    atlas
};
