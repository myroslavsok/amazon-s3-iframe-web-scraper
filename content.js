const ACTIONS = {
    FIND_IFRAME_ACTION: 'find-iframe-action',
    GET_TARGET_LINKS: 'get-target-links',
    DOWNLOAD_CSV: 'download-csv'
};

// Message listener
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.action) {
        case ACTIONS.FIND_IFRAME_ACTION:
            const response = {
                iframeSrc: getIframeSrc(),
                currentPageUrl: window.location.href
            };
            sendResponse(response);
            break;
        case ACTIONS.GET_TARGET_LINKS:
            sendResponse(getTargetAHrefsBySelector(request.targetAHrefsUrl));
            break;
        case ACTIONS.DOWNLOAD_CSV:
            exportCSVFile(request.exhibitorsCSV);
            sendResponse();
            break;
    }
});

// Get iframe src so as to go to new tab
function getIframeSrc() {
    const iframe = document.body.querySelector('iframe');
    iframe.style.border = '2px solid blue';
    console.log('iframe', iframe.src);
    return iframe.src;
}

// Get links for fetching
function getTargetAHrefsBySelector(currentPageUrl) {
    const selector = `a[href^="${currentPageUrl}"]`; // Selector for extracting products' links
    let targetAHrefsArr = [];
    document.body.querySelectorAll(selector).forEach(targetElement => {
        targetAHrefsArr.push(targetElement.getAttribute('href'));
    });
    console.log('links', targetAHrefsArr);
    return targetAHrefsArr;
}

// Export CSV file
function exportCSVFile(result) {
    const FILE_NAME = 'exhibitors.csv';
    let blob = new Blob([result], {type: 'text/csv;charset=utf-8;'});
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, FILE_NAME);
    } else {
        let link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            let url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", FILE_NAME);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}


