/*global describe, it, before, after*/
import {startServer, close} from "../../src/server.js";
import * as chai from 'chai';
import fetch from "node-fetch";
import path from "path";

let expect = chai.expect;

describe('Integration Tests for hello api', function () {

    before(async function () {
        await startServer();
    });

    after(async function () {
        await close();
    });

    it('should say hello without auth', async function () {
        let output = await fetch("http://localhost:5000/hello?name=world", {method: 'GET'});
        output = await output.json();
        expect(output).eql({message: "hello world"});
    });

    it('should say hello Post without auth', async function () {
        let output = await fetch("http://localhost:5000/helloPost", {
            method: 'post',
            body: JSON.stringify({name: "ola"}),
            headers: {'Content-Type': 'application/json'}
        });
        output = await output.json();
        expect(output).eql({message: "hello ola"});
    });

    it('should hello Post say 400 without required args', async function () {
        let output = await fetch("http://localhost:5000/helloPost", {
            method: 'post',
            body: JSON.stringify({}),
            headers: {'Content-Type': 'application/json'}
        });
        expect(output.status).eql(400);
        const json = await output.json();
        expect(json.error).to.exist;
    });

    it('should say helloAuth if authorised', async function () {
        let output = await fetch("http://localhost:5000/helloAuth?name=world", {
            method: 'GET',
            headers: {
                authorization: "Basic hehe"
            }
        });
        output = await output.json();
        expect(output).eql({message: "hello world"});
    });

    it('should not say helloAuth if unauthorised', async function () {
        let output = await fetch("http://localhost:5000/helloAuth?name=world", {method: 'GET'});
        expect(output.status).eql(401);
        output = await output.json();
        expect(output).eql({error: "Unauthorized"});
    });

    it('should reply 404 if route doesnt exist', async function () {
        let output = await fetch("http://localhost:5000/routeNotExist?name=world", {method: 'GET'});
        expect(output.status).eql(404);
        output = await output.json();
        expect(output).eql({error: "Not Found"});
    });

    it('should get static web page', async function () {
        // First test with trailing slash (directory)
        let output = await fetch("http://localhost:5000/www/", {
            method: 'GET',
            headers: {
                'Accept': 'text/html'  // Add this header
            }
        });
        console.log("Status:", output.status);
        if (output.status !== 200) {
            console.log("Error response:", await output.text());
        }
        expect(output.status).eql(200);
        let content = await output.text();
        expect(content.includes("Hello HTML")).eql(true);

        // Test index.html directly
        output = await fetch("http://localhost:5000/www/index.html", {
            method: 'GET',
            headers: {
                'Accept': 'text/html'
            }
        });
        expect(output.status).eql(200);
        content = await output.text();
        expect(content.includes("Hello HTML")).eql(true);
    });
});
