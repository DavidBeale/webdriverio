/**
 *
 * Inject a snippet of JavaScript into the page for execution in the context of the PhantomJS page object.
 * The executed script is assumed to be synchronous and the result of evaluating the script is returned to
 * the client.
 *
 * Allows access to PhantomJS specific features such as rendering a page to a PDF file.
 *
 * The script argument defines the script to execute in the form of a function body. The value returned by
 * that function will be returned to the client. The function will be invoked with the provided args array
 * and the values may be accessed via the arguments object in the order specified.
 *
 * Arguments may be any JSON-primitive, array, or JSON object. JSON objects that define a WebElement
 * reference will be converted to the corresponding DOM element. Likewise, any WebElements in the script
 * result will be returned to the client as WebElement JSON objects.
 *
 * <example>
    :execute.js
    it('should inject javascript on the page', function () {
        var result = browser.executePhantomJS(function(path) {
            // PhantomJS page context - you may not access client or console
            page.render(path);
            return 'done';
        }, './mydoc.pdf')

        // node.js context - client and console are available
        console.log(result.value); // outputs: 'done'
    });
 * </example>
 *
 * @param {String|Function} script                     The script to execute.
 * @param {*}               [argument1,...,argumentN]  script arguments
 *
 * @return {*}             The script result.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-execute-script
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function executePhantomJS (...args) {
    let script = args.shift()

    /*!
     * parameter check
     */
    if ((typeof script !== 'string' && typeof script !== 'function')) {
        throw new ProtocolError('number or type of arguments don\'t agree with executePhantomJS protocol command')
    }

    /*!
     * instances started as multibrowserinstance can't getting called with
     * a function paramter, therefor we need to check if it starts with "function () {"
     */
    if (typeof script === 'function' || (this.inMultibrowserMode && script.indexOf('function (') === 0)) {
        script = `return (${script}).apply(this, arguments)`
    }

    return this.requestHandler.create('/session/:sessionId/phantom/execute', { script, args }).catch((err) => {
        /**
         * jsonwire command not supported try webdriver endpoint
         */
        if (err.message.match(/did not match a known command/)) {
            return this.requestHandler.create('/session/:sessionId/phantom/execute/sync', { script, args })
        }

        throw err
    })
}
