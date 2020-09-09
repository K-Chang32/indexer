import { GluegunToolbox } from 'gluegun'
import chalk from 'chalk'

import { loadValidatedConfig } from '../../../config'
import { createIndexerManagementClient } from '../../../client'
import { fixParameters, validateDeploymentID } from '../../../command-helpers'
import { IndexingDecisionBasis } from '@graphprotocol/indexer-common'
import { setIndexingRule, printIndexingRules, parseDeploymentID } from '../../../rules'

const HELP = `
${chalk.bold('graph indexer rules stop')}  [options] global
${chalk.bold('graph indexer rules stop')}  [options] <deployment-id>
${chalk.bold('graph indexer rules never')} [options] global
${chalk.bold('graph indexer rules never')} [options] <deployment-id>

${chalk.dim('Options:')}

  -h, --help                    Show usage information
  -o, --output table|json|yaml  Choose the output format: table (default), JSON, or YAML
`

module.exports = {
  name: 'stop',
  alias: ['never'],
  description: 'Never index a deployment (and stop indexing it if necessary)',
  run: async (toolbox: GluegunToolbox) => {
    const { print, parameters } = toolbox

    const { h, help, o, output } = parameters.options
    const [deployment] = fixParameters(parameters, { h, help }) || []
    const outputFormat = o || output || 'table'

    if (help || h) {
      print.info(HELP)
      return
    }

    if (!['json', 'yaml', 'table'].includes(outputFormat)) {
      print.error(`Invalid output format "${outputFormat}"`)
      process.exitCode = 1
      return
    }

    const config = loadValidatedConfig()

    try {
      validateDeploymentID(deployment, { all: false })
    } catch (error) {
      print.error(error.toString())
      process.exitCode = 1
      return
    }

    const inputRule = {
      deployment,
      decisionBasis: IndexingDecisionBasis.NEVER,
    }

    // Update the indexing rule according to the key/value pairs
    try {
      const client = await createIndexerManagementClient({ url: config.api })
      const rule = await setIndexingRule(client, inputRule)
      printIndexingRules(print, outputFormat, parseDeploymentID(deployment), rule, [])
    } catch (error) {
      print.error(error.toString())
    }
  },
}
