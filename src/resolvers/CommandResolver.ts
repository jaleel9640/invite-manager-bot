import { Command, Context } from '../commands/Command';

import { Resolver } from './Resolver';

export class CommandResolver extends Resolver {
	public async resolve(value: string, { guild, t }: Context): Promise<Command> {
		if (!guild || !value) {
			return;
		}

		const name = value.toLowerCase();
		const cmds = this.client.cmds.commands.filter(
			c => c.name.toLowerCase().includes(name) || c.aliases.indexOf(name) >= 0
		);

		if (cmds.length === 0) {
			throw Error(t('arguments.command.notFound'));
		} else if (cmds.length === 1) {
			return cmds[0];
		} else {
			const cmd = cmds.find(c => c.name.length - name.length === 0);
			if (!cmd) {
				throw Error(
					t('arguments.command.multiple', {
						commands: cmds.map(c => `\`${c.name}\``).join(', ')
					})
				);
			}
			return cmd;
		}
	}
}