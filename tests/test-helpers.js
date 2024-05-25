import { expect, test, vi } from 'vitest';

const config = require('../src/config');
const actions = require('../src/actions');
const feedbacks = require('../src/feedbacks');
const variables = require('../src/variables');
const presets = require('../src/presets');
const internalData = require('../src/data');

const utils = require('../src/utils');

const models = require('../src/models');
const constants = require('../src/constants');
const processResponse = require('../src/process-response');

export class TestAtdmInstance {
    constructor() {
        Object.assign(this, {
			...config,
			...actions,
			...feedbacks,
			...variables,
			...presets,
			...internalData,
			...utils,
			...models,
			...constants,
            ...processResponse
		});

        this.DATA = {};
    }

    init(config) {
        this.config = config;
        this.initData();
		this.initActions();
		this.initFeedbacks();
		this.initVariables();
		this.initPresets();
	}

    setActionDefinitions(actions){
        this.actionDefinitions = actions;
    }
    
    setFeedbackDefinitions(feedbacks){
        this.feedbackDefinitions = feedbacks;
    }

    setVariableDefinitions(){}
    setVariableValues(){}
    setPresetDefinitions(){}
    sendCommand(){}
}
