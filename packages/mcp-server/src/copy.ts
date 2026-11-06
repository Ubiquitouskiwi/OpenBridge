/**
 * Fixed English copy for AI agents: the disclaimer attached to every result, the server
 * instructions sent at initialization, and the screening-guide prompt. Kept in one place so
 * a maintainer can review the wording (AGENTS.md section 5: disclaimers need human review).
 */

/** Attached to every screening and income-change result. Never omitted. */
export const DISCLAIMER =
  'These are estimates only. They are not a decision and not legal advice. ' +
  'The rules used here are drafts that experts have not reviewed yet, so they may be wrong. ' +
  'Only the agency that runs each program can decide who qualifies. ' +
  'Anyone who wants help should apply. They can also call 211 or a local legal aid office.';

/** Suggested to agents when a state is not supported, or a person needs more help. */
export const HELP_LINE =
  'Call or text 211 (or visit 211.org) to find local help. Legal aid offices can also help.';

/** Server-level instructions: how an agent should behave when using these tools. */
export const SERVER_INSTRUCTIONS = [
  'OpenBridge estimates whether a U.S. household may qualify for SNAP, Medicaid/CHIP, WIC,',
  'LIHEAP, and TANF. You talk with the person; OpenBridge does the math with cited, versioned',
  'rules. Follow these rules:',
  '1. Ask only for what the tools need, one short question at a time, in plain words.',
  '2. Never ask for or send names, Social Security numbers, street addresses, phone numbers,',
  '   or birth certificates. Use short labels like "self" or "kid1" for people.',
  '3. Immigration or citizenship status is optional. "prefer_not_to_say" is always fine.',
  '4. Never tell someone they do not qualify as if it were final. Results are estimates.',
  '   Share the reasons and the next steps, and encourage people to apply anyway.',
  '5. Suggest 211 or a local legal aid office when someone needs more help.',
  '6. Tell the person that what they share is processed by the AI service they are using.',
  '   OpenBridge itself does not store or log it.',
  '7. Use list_supported_states first if you are not sure the state is supported.',
].join('\n');

/** Text of the `screening_guide` prompt. */
export const SCREENING_GUIDE = [
  'Help me check which public benefits my household may qualify for, using OpenBridge.',
  '',
  'Please:',
  '- First tell me that what I share goes to this AI service, and that OpenBridge does not',
  '  store it. Do not ask for names, Social Security numbers, or addresses.',
  '- Ask me a few simple questions, one at a time: my state, who lives with me (ages and how',
  '  they are related to me), anyone pregnant or with a disability, our income and how often',
  '  it is paid, and our housing, utility, child care, and medical costs.',
  '- Immigration status is optional. I can say "prefer not to say".',
  '- Then run screen_household and explain each program in plain words: the estimate, the',
  '  reasons, and what to do next. Treat every result as an estimate, not a final answer.',
  '- If I ask about a raise or more hours, use explore_income_change.',
  '- Remind me that only the agency decides, that I can apply anyway, and that 211 or legal',
  '  aid can help.',
].join('\n');
