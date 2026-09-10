module.exports = {
	initData() {
        let model = this.MODELS.find((model) => model.id == this.config.model);

		this.DATA.operator_page = [];
		for (let i = 1; i <= 8; i++) {
			let obj = {};
			for (let j = 1; j <=8; j++) {
				obj[`fader_${j}_level`] = 0;
				obj[`fader_${j}_mute`] = false;
			}
			this.DATA.operator_page.push(obj);
		}

		if (model.data_request.includes('input_channel_settings')) {
			this.DATA.input_channel_settings = [];
		}

		if (model.data_request.includes('subinput_channel_settings')) {
			this.DATA.sub_input_channel_settings = [];
		}

		if (model.data_request.includes('input_gain_level')) {
			this.DATA.input_gain_levels = [];
		}

		if (model.data_request.includes('output_channel_settings')) {
			this.DATA.output_channel_settings = [];
		}

		if (model.data_request.includes('output_level')) {
			this.DATA.output_levels = [];
		}

		if (model.data_request.includes('output_mute')) {
			this.DATA.output_mutes = [];
		}

		if (model.data_request.includes('level_meter')) {
			this.DATA.meter_levels = [];
		}

		this.DATA.open_channels = [];

		// Populated from UDP notices rather than polling - there is no get command for these.
		this.DATA.cancut = [];
		this.DATA.arraymic_mutes = [];
		this.DATA.fbs = [];
		this.DATA.rec_status = '0';
		this.DATA.preset_names = [];
		this.DATA.firmware_version = '';
		this.DATA.device_id = '';
		this.DATA.aec_calibration_result = '';
		this.DATA.arraymic_mute = false;
    },

    /**
     * The mixer confirms a set command with an ACK, but the new value is only reported by the next poll.
     * At a 10 second interval that leaves a button showing the old state for up to 10 seconds, which reads
     * as the command having been ignored. Applying the change locally keeps the button honest; the next
     * poll still wins if the mixer disagrees.
     */
    setOutputMuteState(outputChannel, mute) {
        if (!Array.isArray(this.DATA.output_mutes)) {
            return
        }

        let id = outputChannel.toString();
        let existing = this.DATA.output_mutes.find((CHANNEL) => CHANNEL.id == id);

        if (existing) {
            existing.mute = mute;
        }
        else {
            this.DATA.output_mutes.push({ id: id, mute: mute });
        }

        this.requestUiUpdate();
    },

    setInputMuteState(inputChannel, mute) {
        if (!Array.isArray(this.DATA.input_gain_levels)) {
            return
        }

        let id = inputChannel.toString();
        let existing = this.DATA.input_gain_levels.find((CHANNEL) => CHANNEL.id == id);

        if (existing) {
            existing.mute = mute;
        }
        else {
            this.DATA.input_gain_levels.push({ id: id, mute: mute });
        }

        this.requestUiUpdate();
    },

    setOperatorFaderMuteState(page, fader, mute) {
        let index = parseInt(page) - 1;

        if (!Array.isArray(this.DATA.operator_page) || !this.DATA.operator_page[index]) {
            return
        }

        this.DATA.operator_page[index][`fader_${fader}_mute`] = mute;

        this.requestUiUpdate();
    },

    setArrayMicMuteState(mute) {
        this.DATA.arraymic_mute = mute;

        this.requestUiUpdate();
    }
};