/*global describe, it, before, after*/
import {startServer, close} from "../../src/server.js";
import * as chai from 'chai';
import fetch from "node-fetch";

let expect = chai.expect;

describe('Integration Tests for hello api', function () {

    before(async function () {
        await startServer();
    });

    after(async function () {
        await close();
    });

    it('should say hello without auth', async function () {
        let output = await fetch("http://localhost:5000/hello?name=world", { method: 'GET'});
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
        output = await output.json();
        expect(output.statusCode).eql(400);
    });

    it('should say helloAuth if authorised', async function () {
        let output = await fetch("http://localhost:5000/helloAuth?name=world", { method: 'GET', headers: {
            authorization: "Basic hehe"
        }});
        output = await output.json();
        expect(output).eql({message: "hello world"});
    });

    it('should not say helloAuth if unauthorised', async function () {
        let output = await fetch("http://localhost:5000/helloAuth?name=world", { method: 'GET'});
        expect(output.status).eql(401);
        output = await output.text();
        expect(output).eql("Unauthorized");
    });

    it('should reply 404 if route doesnt exist', async function () {
        let output = await fetch("http://localhost:5000/routeNotExist?name=world", { method: 'GET'});
        expect(output.status).eql(404);
        output = await output.text();
        expect(output).eql("Not Found");
    });

    it('should get static web page', async function () {
        let output = await fetch("http://localhost:5000/www", { method: 'GET'});
        expect(output.status).eql(200);
        output = await output.text();
        expect(output.includes("Hello HTML")).eql(true);
        output = await fetch("http://localhost:5000/www/", { method: 'GET'});
        expect(output.status).eql(200);
        output = await output.text();
        expect(output.includes("Hello HTML")).eql(true);
    });

    it('should get 404 if static web page doesnt exist', async function () {
        let output = await fetch("http://localhost:5000/www/noop", { method: 'GET'});
        expect(output.status).eql(404);
    });
});
