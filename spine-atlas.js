const atlas = (data) => {
    const pages = [];
    let page = {};
    let pageData = {};
    let state = 0;

    for (const line of data.split('\n')) {
        if (line.trim().length === 0) {
            if (state > 0) {
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

export {
    atlas
};
