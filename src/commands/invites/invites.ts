import { Message, User } from 'eris';

import { IMClient } from '../../client';
import { UserResolver } from '../../resolvers';
import { BotCommand, CommandGroup } from '../../types';
import { getInviteCounts, promoteIfQualified } from '../../util';
import { Command, Context } from '../Command';

export default class extends Command {
	public constructor(client: IMClient) {
		super(client, {
			name: BotCommand.invites,
			aliases: ['invite', 'rank'],
			desc: 'Show personal invites',
			args: [
				{
					name: 'user',
					resolver: UserResolver,
					description: 'The user for whom you want to show invites.'
				}
			],
			group: CommandGroup.Invites,
			guildOnly: true
		});
	}

	public async action(
		message: Message,
		[user]: [User],
		{ guild, t, me }: Context
	): Promise<any> {
		let target = user ? user : message.author;
		const invites = await getInviteCounts(guild.id, target.id);

		let textMessage = '';
		if (target.id === message.author.id) {
			textMessage = t('cmd.invites.amount.self', {
				total: invites.total,
				regular: invites.regular,
				custom: invites.custom,
				fake: invites.fake,
				leave: invites.leave
			});
		} else {
			textMessage = t('cmd.invites.amount.other', {
				target: `<@${target.id}>`,
				total: invites.total,
				regular: invites.regular,
				custom: invites.custom,
				fake: invites.fake,
				leave: invites.leave
			});
		}
		textMessage += '\n';

		if (!target.bot) {
			let targetMember = guild.members.get(user.id);
			if (!targetMember) {
				targetMember = await guild.getRESTMember(user.id);
			}

			// Only process if the user is still in the guild
			if (targetMember) {
				const promoteInfo = await promoteIfQualified(
					this.client,
					guild,
					targetMember,
					me,
					invites.total
				);

				if (promoteInfo) {
					const {
						nextRank,
						nextRankName,
						numRanks,
						shouldHave,
						shouldNotHave,
						dangerous
					} = promoteInfo;

					if (nextRank) {
						let nextRankPointsDiff = nextRank.numInvites - invites.total;
						textMessage += t('cmd.invites.nextRank', {
							self: message.author.id,
							target: target.id,
							nextRankPointsDiff,
							nextRankName
						});
					} else {
						if (numRanks > 0) {
							textMessage += t('cmd.invites.highestRank');
						}
					}

					if (shouldHave.length > 0) {
						textMessage +=
							'\n\n' +
							t('roles.shouldHave', {
								shouldHave: shouldHave.map(r => `<@&${r.id}>`).join(', ')
							});
					}
					if (shouldNotHave.length > 0) {
						textMessage +=
							'\n\n' +
							t('roles.shouldNotHave', {
								shouldNotHave: shouldNotHave.map(r => `<@&${r.id}>`).join(', ')
							});
					}
					if (dangerous.length > 0) {
						textMessage +=
							'\n\n' +
							t('roles.dangerous', {
								dangerous: dangerous.map(r => `<@&${r.id}>`).join(', ')
							});
					}
				}
			}
		}

		const embed = this.client.createEmbed({
			title: target.username,
			description: textMessage
		});

		return this.client.sendReply(message, embed);
	}
}
