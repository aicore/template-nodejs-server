/*global describe, it*/
import * as chai from 'chai';
import {hello, getHelloSchema} from "../../../src/api/hello.js";
import {getSimpleGetReply, getSimpleGETRequest} from '../data/simple-request.js';
import Ajv from "ajv";

export const AJV = new Ajv();


let expect = chai.expect;

describe('unit Tests for hello api', function () {

    it('should say hello', async function () {
        let helloResponse = await hello(getSimpleGETRequest(), getSimpleGetReply());
        expect(helloResponse).eql({message: 'hello rambo'});
    });

    it('should validate schemas for sample request/responses', async function () {
        // request
        const requestValidator = AJV.compile(getHelloSchema().schema.querystring);
        expect(requestValidator(getSimpleGETRequest().query)).to.be.true;
        // response
        const successResponseValidator = AJV.compile(getHelloSchema().schema.response["200"]);
        let response = await hello(getSimpleGETRequest(), getSimpleGetReply());
        expect(successResponseValidator(response)).to.be.true;
    });
});
