import type {
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionStaticUpgradeScript,
	CompanionUpgradeContext,
} from '@companion-module/base'
import type { ModuleConfig } from './config.js'

export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig>[] = [
	// Placeholder from the original module. Never remove an upgrade script once it has shipped: the index
	// of each one is what Companion records against a connection.
	function (): CompanionStaticUpgradeResult<ModuleConfig, undefined> {
		return {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}
	},

	/**
	 * Polling used to be enabled implicitly by any non-zero interval, and allowed intervals as low as 50ms.
	 * It is now an explicit checkbox, and the interval is floored at 500ms so a poll batch can finish before
	 * the next one is due. The port, the pipeline depth and the notification settings are also new.
	 */
	function (
		_context: CompanionUpgradeContext<ModuleConfig>,
		props: CompanionStaticUpgradeProps<ModuleConfig, undefined>,
	): CompanionStaticUpgradeResult<ModuleConfig, undefined> {
		let updatedConfig: ModuleConfig | null = null

		const config = props.config

		if (config) {
			if (config.polling === undefined) {
				config.polling = config.poll_interval === undefined || config.poll_interval > 0
				updatedConfig = config
			}

			if (config.poll_interval !== undefined && config.poll_interval > 0 && config.poll_interval < 500) {
				config.poll_interval = 500
				updatedConfig = config
			}

			if (config.poll_interval === undefined || config.poll_interval <= 0) {
				config.poll_interval = 1000
				updatedConfig = config
			}

			if (config.port === undefined || config.port <= 0) {
				config.port = 17300
				updatedConfig = config
			}

			if (config.pipeline_depth === undefined || config.pipeline_depth <= 0) {
				config.pipeline_depth = 8
				updatedConfig = config
			}

			// Notifications are off on the mixer by default, so leave them off here rather than filling the
			// log with join failures on an upgrade.
			if (config.notices === undefined) {
				config.notices = false
				config.multicast_address = '225.0.0.100'
				config.multicast_port = 17000
				config.multicast_interface = ''
				config.level_meters = false
				config.level_meter_interval = 500
				updatedConfig = config
			}
		}

		return {
			updatedConfig: updatedConfig,
			updatedActions: [],
			updatedFeedbacks: [],
		}
	},
]
