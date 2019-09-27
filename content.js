console.log("content works");

const ACTIONS = {
    GET_CONTENT_PAGE_URL: 'get-content-page-url'
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === ACTIONS.GET_CONTENT_PAGE_URL) {
        sendResponse({contentPageUrl: window.location.href});
    }
});

