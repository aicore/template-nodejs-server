/*global describe, it*/
import * as chai from 'chai';
import {hello, getHelloSchema, helloPost, getHelloPostSchema} from "../../../src/api/hello.js";
import {getSimpleGetReply, getSimpleGETRequest, getSimplePOSTReply, getSimplePOSTRequest} from '../data/simple-request.js';
import Ajv from "ajv";

export const AJV = new Ajv();


let expect = chai.expect;

describe('unit Tests for hello api', function () {

    it('should say hello', async function () {
        let helloResponse = await hello(getSimpleGETRequest(), getSimpleGetReply());
        expect(helloResponse).eql({message: 'hello rambo'});
    });

    it('should validate schemas for sample GET request/responses', async function () {
        let request = getSimpleGETRequest();
        // request
        const requestValidator = AJV.compile(getHelloSchema().schema.querystring);
        expect(requestValidator(request.query)).to.be.true;
        // message too long validation
        request.query.name = "a name that is too long";
        expect(requestValidator(request.query)).to.be.false;
        // response
        const successResponseValidator = AJV.compile(getHelloSchema().schema.response["200"]);
        let response = await hello(getSimpleGETRequest(), getSimpleGetReply());
        expect(successResponseValidator(response)).to.be.true;
    });

    it('should validate schemas for sample POST request/responses', async function () {
        let request = getSimplePOSTRequest();
        // request
        const requestValidator = AJV.compile(getHelloPostSchema().schema.body);
        expect(requestValidator(request.body)).to.be.true;
        // message too long validation
        request.body.name = "a name that is too long";
        expect(requestValidator(request.body)).to.be.false;
        // response
        const successResponseValidator = AJV.compile(getHelloPostSchema().schema.response["200"]);
        let response = await helloPost(getSimplePOSTRequest(), getSimplePOSTReply());
        expect(successResponseValidator(response)).to.be.true;
    });
});
