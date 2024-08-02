function Atlas() {};

Atlas.prototype.parse = (data) => {
    const pages = [];
    let page = {};
    let pageData = null;
    let state = 0;

    for (const line of data.split('\n')) {
        if (line.trim().length === 0) {
            if (state > 0) {
                if (pageData) {
                    page.data.push(pageData);
                    pageData = null;
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
                    data: [],
                };

                break;
            case 1: // page option or new data block
                if (line.includes(':')) {
                    let [optName, optVal] = line.split(':')
                    page[optName.trim()] = optVal.split(',').map(x => x.trim())
                } else {
                    pageData = {
                        file: line.trim(),
                    };

                    state = 2;
                }

                break;
            case 2: // data block option or new data block
                if (line.includes(':')) {
                    let [optName, optVal] = line.split(':')
                    pageData[optName.trim()] = optVal.split(',').map(x => x.trim())
                } else {
                    page.data.push(pageData);
                    pageData = {
                        file: line.trim(),
                    };
                }

                break;
        }
    }

    return pages;
};

Atlas.prototype.stringify = (pages) => {
	let data = '';
	let pageData = '';

	for (const page of pages) {
		// default property preset
		// used to retain correct prop ordering, and filtering newly added props
		const optNames = ['file', 'size', 'format', 'filter', 'repeat', 'data'];
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
		for (const sprite of page.data) {
			for (const optName of Object.keys(sprite)) {
				if (optName === 'file') {
					pageData += `${sprite[optName]}\n`;
					continue;
				}
				pageData += `  ${optName}: ${sprite[optName]}\n`;
			}
		};

		data += pageData;
	}

	return data;
}

const atlas = new Atlas();

export {
    atlas
};
