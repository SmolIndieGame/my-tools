import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });

    var array = new Array<number>(100000);
    test('array shift', () => {
        const start = Date.now();
        for (let i = 0; i < 100000; i++) {
            array.unshift(i);
            array.pop();
        }
        console.log(Date.now() - start);
    });

    test('array push', () => {
        const start = Date.now();
        for (let i = 0; i < 100000; i++) {
            array.push(i);
            array.pop();
        }
        console.log(Date.now() - start);
    });
});
