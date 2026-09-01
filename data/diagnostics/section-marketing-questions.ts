import type { MiniDiagnosticQuestion } from "./mini-marketing-types.ts"

export const SECTION_DIAGNOSTIC_QUESTIONS: MiniDiagnosticQuestion[] = [
  {
    sourceItemId: "section-diag-q1",
    questionNumber: 1,
    targetTimeSeconds: 50,
    difficulty: 1,
    questionType: "Main Conclusion",
    stimulusText: `The artisan bakery recently switched to a cheaper wholesale flour to cut operational costs. However, customer complaints regarding the texture of the bread have skyrocketed since the change was implemented. So the bakery must immediately revert to its original flour supplier. After all, losing a loyal customer base will cost the business far more in the long run than what it saves on cheaper ingredients.`,
    stemText:
      "Which one of the following most accurately expresses the main conclusion of the argument?",
    choices: [
      {
        letter: "A",
        text: "Customer complaints regarding the bread's texture have increased significantly.",
        explanation:
          "This is a supporting premise, not the ultimate claim the author is trying to prove.",
      },
      {
        letter: "B",
        text: "The bakery needs to return to using its previous flour supplier.",
        explanation:
          'This is a direct paraphrase of "the bakery must immediately revert to its original flour supplier."',
      },
      {
        letter: "C",
        text: "Retaining a loyal customer base is more financially valuable than reducing ingredient costs.",
        explanation:
          "This is a supporting reason used to justify the conclusion, not the conclusion itself.",
      },
      {
        letter: "D",
        text: "The artisan bakery switched to a cheaper flour solely to cut operational costs.",
        explanation: "This is background context establishing the premise, not the main conclusion.",
      },
      {
        letter: "E",
        text: "Reverting to the original flour supplier is the only way to satisfy the bakery's loyal customers.",
        explanation:
          "The author never claims this is the only way to satisfy customers, making this too extreme.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>To crack a Main Conclusion question, you need to separate the premises (the evidence) from the ultimate claim (what the author is trying to prove).</p>
<ul>
<li><strong>Premise 1:</strong> The bakery switched to cheaper flour to cut costs.</li>
<li><strong>Premise 2:</strong> Customer complaints about bread texture have skyrocketed since the change.</li>
<li><strong>Conclusion:</strong> So the bakery must immediately revert to its original flour supplier.</li>
<li><strong>Premise 3:</strong> Losing a loyal customer base will cost more than savings on cheaper ingredients (This supports the conclusion).</li>
</ul>
<p>The word "So" is your primary structural indicator here. The entire paragraph exists to justify the recommendation to switch back to the original flour supplier.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. This is a supporting premise, not the ultimate claim the author is trying to prove.</p>
<p><strong>B)</strong> Correct. This is a direct paraphrase of "the bakery must immediately revert to its original flour supplier."</p>
<p><strong>C)</strong> Incorrect. This is a supporting reason used to justify the conclusion, not the conclusion itself.</p>
<p><strong>D)</strong> Incorrect. This is background context establishing the premise, not the main conclusion.</p>
<p><strong>E)</strong> Incorrect. The author never claims this is the only way to satisfy customers, making this too extreme.</p>`,
  },
  {
    sourceItemId: "section-diag-q2",
    questionNumber: 2,
    targetTimeSeconds: 60,
    difficulty: 1,
    questionType: "Most Strongly Supported",
    stimulusText: `The rare Blue Ghost Orchid only blooms when the ambient humidity of its environment remains above 80 percent for at least three consecutive days. Furthermore, it only grows in the heavily shaded underbrush of the eastern rainforest. Recently, an amateur botanist claimed to have photographed a fully blooming Blue Ghost Orchid in a highly controlled botanical greenhouse that maintains a strict maximum humidity of 60 percent.`,
    stemText:
      "Which one of the following is most strongly supported by the information above?",
    choices: [
      {
        letter: "A",
        text: "The Blue Ghost Orchid cannot survive outside of the eastern rainforest.",
        explanation:
          "The stimulus says it only grows in the eastern rainforest, but says nothing about whether it can survive elsewhere.",
      },
      {
        letter: "B",
        text: "The botanist's photograph was taken in the eastern rainforest rather than a greenhouse.",
        explanation:
          "The botanist claimed the photo was taken in a greenhouse; we have no evidence supporting the rainforest alternative.",
      },
      {
        letter: "C",
        text: "The flower that the botanist photographed in the botanical greenhouse was likely not a blooming Blue Ghost Orchid.",
        explanation:
          "A blooming Blue Ghost Orchid requires humidity above 80% for three days, but the greenhouse caps humidity at 60%, making the identification highly unlikely.",
      },
      {
        letter: "D",
        text: "The greenhouse failed to properly maintain its strict maximum humidity of 60 percent.",
        explanation:
          "We have no evidence the greenhouse malfunctioned; the stated conditions simply conflict with what a blooming Blue Ghost Orchid requires.",
      },
      {
        letter: "E",
        text: "The botanist intentionally falsified the photograph to gain recognition in the scientific community.",
        explanation:
          "Nothing in the stimulus supports an accusation of intentional fraud; a misidentification is more strongly supported.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a Most Strongly Supported question. You must synthesize the given facts and deduce what is highly likely to be true without adding outside assumptions.</p>
<ul>
<li><strong>Fact 1:</strong> Blue Ghost Orchid only blooms when humidity stays above 80% for at least three consecutive days.</li>
<li><strong>Fact 2:</strong> It only grows in the eastern rainforest underbrush.</li>
<li><strong>Fact 3:</strong> A botanist photographed a fully blooming Blue Ghost Orchid in a greenhouse with a strict maximum humidity of 60%.</li>
</ul>
<p>The conflict is clear: a fully blooming Blue Ghost Orchid requires conditions the greenhouse cannot provide. The most supported inference is that the photographed flower was likely misidentified.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The stimulus says it only grows in the eastern rainforest, but says nothing about whether it can survive elsewhere.</p>
<p><strong>B)</strong> Incorrect. The botanist claimed the photo was taken in a greenhouse; we have no evidence supporting the rainforest alternative.</p>
<p><strong>C)</strong> Correct. A blooming Blue Ghost Orchid requires humidity above 80% for three days, but the greenhouse caps humidity at 60%, making the identification highly unlikely.</p>
<p><strong>D)</strong> Incorrect. We have no evidence the greenhouse malfunctioned; the stated conditions simply conflict with what a blooming Blue Ghost Orchid requires.</p>
<p><strong>E)</strong> Incorrect. Nothing in the stimulus supports an accusation of intentional fraud; a misidentification is more strongly supported.</p>`,
  },
  {
    sourceItemId: "section-diag-q3",
    questionNumber: 3,
    targetTimeSeconds: 65,
    difficulty: 2,
    questionType: "Strengthen",
    stimulusText: `An app developer noticed that users of her productivity software often uninstalled the application within the first week of downloading it. She theorized that the app's highly complex initial tutorial was overwhelming new users, causing them to quit in frustration. To significantly reduce the uninstall rate, she plans to replace the complex tutorial with a simple, interactive setup guide.`,
    stemText:
      "Which one of the following, if true, provides the most support for the developer's plan?",
    choices: [
      {
        letter: "A",
        text: "Users who skipped the original complex tutorial entirely were significantly less likely to uninstall the app in the first week.",
        explanation:
          "This directly supports the theory that the complex tutorial drives uninstalls and that removing it should reduce the uninstall rate.",
      },
      {
        letter: "B",
        text: "The productivity software requires users to learn several unique organizational frameworks to utilize its best features.",
        explanation:
          "This suggests the app is inherently complex, which could weaken rather than strengthen the developer's plan.",
      },
      {
        letter: "C",
        text: "Most competing productivity applications also feature complex initial tutorials.",
        explanation:
          "What competitors do is irrelevant to whether simplifying the tutorial will reduce uninstalls in this app.",
      },
      {
        letter: "D",
        text: "The developer previously replaced a complex tutorial in a different app without seeing a change in user retention.",
        explanation:
          "This undermines the developer's plan by suggesting tutorial simplification may not improve retention.",
      },
      {
        letter: "E",
        text: "A simple, interactive setup guide is generally less expensive for a software developer to design and implement.",
        explanation:
          "Cost savings do not strengthen the causal claim that the change will reduce uninstall rates.",
      },
    ],
    correctAnswer: "A",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a causal argument that we are asked to strengthen.</p>
<ul>
<li><strong>Premise:</strong> Users often uninstall the app within the first week.</li>
<li><strong>Theory:</strong> The complex tutorial overwhelms new users, causing them to quit.</li>
<li><strong>Plan/Conclusion:</strong> Replacing the complex tutorial with a simple guide will significantly reduce the uninstall rate.</li>
</ul>
<p>The gap is the assumption that the tutorial is actually causing the uninstalls. To strengthen, we want evidence linking the complex tutorial to higher uninstall rates.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Correct. This directly supports the theory that the complex tutorial drives uninstalls and that removing it should reduce the uninstall rate.</p>
<p><strong>B)</strong> Incorrect. This suggests the app is inherently complex, which could weaken rather than strengthen the developer's plan.</p>
<p><strong>C)</strong> Incorrect. What competitors do is irrelevant to whether simplifying the tutorial will reduce uninstalls in this app.</p>
<p><strong>D)</strong> Incorrect. This undermines the developer's plan by suggesting tutorial simplification may not improve retention.</p>
<p><strong>E)</strong> Incorrect. Cost savings do not strengthen the causal claim that the change will reduce uninstall rates.</p>`,
  },
  {
    sourceItemId: "section-diag-q4",
    questionNumber: 4,
    targetTimeSeconds: 65,
    difficulty: 2,
    questionType: "Flaw",
    stimulusText: `Mayor: The new municipal zoning proposal severely restricts commercial development near the historic district. The local Chamber of Commerce strongly opposes this proposal, arguing that it will stifle economic growth. However, the Chamber of Commerce is comprised of business owners primarily interested in maximizing their own corporate profits. Therefore, their arguments against the zoning proposal must be completely unfounded.`,
    stemText: "The mayor's reasoning is flawed because it",
    choices: [
      {
        letter: "A",
        text: "presumes, without providing justification, that the historic district is more valuable than economic growth.",
        explanation:
          "The mayor never compares the value of the historic district to economic growth.",
      },
      {
        letter: "B",
        text: "rejects an argument solely on the basis of the presumed motives of the group advancing that argument.",
        explanation:
          "The mayor dismisses the Chamber's opposition because of their profit motives, without addressing the substance of their economic growth claim.",
      },
      {
        letter: "C",
        text: "treats a condition that is necessary for economic growth as a condition that is sufficient to guarantee it.",
        explanation:
          "The mayor does not make any conditional reasoning about necessary or sufficient conditions for economic growth.",
      },
      {
        letter: "D",
        text: "attacks a specific proposal rather than addressing the broader economic policies of the city.",
        explanation:
          "Attacking a specific proposal is not a logical flaw; the mayor is evaluating a particular zoning proposal.",
      },
      {
        letter: "E",
        text: "takes for granted that commercial development inevitably damages historic districts.",
        explanation:
          "The mayor never claims commercial development inevitably damages historic districts.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a flaw question testing whether you can identify an ad hominem or motive-based dismissal.</p>
<ul>
<li><strong>Premise:</strong> The Chamber of Commerce opposes the zoning proposal, arguing it will stifle economic growth.</li>
<li><strong>Premise:</strong> The Chamber is comprised of business owners interested in maximizing profits.</li>
<li><strong>Conclusion:</strong> Their arguments against the proposal must be completely unfounded.</li>
</ul>
<p>The Flaw: The mayor attacks the motives of the arguers rather than evaluating whether their claim about economic growth is actually true. Even profit-motivated groups can make valid arguments.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The mayor never compares the value of the historic district to economic growth.</p>
<p><strong>B)</strong> Correct. The mayor dismisses the Chamber's opposition because of their profit motives, without addressing the substance of their economic growth claim.</p>
<p><strong>C)</strong> Incorrect. The mayor does not make any conditional reasoning about necessary or sufficient conditions for economic growth.</p>
<p><strong>D)</strong> Incorrect. Attacking a specific proposal is not a logical flaw; the mayor is evaluating a particular zoning proposal.</p>
<p><strong>E)</strong> Incorrect. The mayor never claims commercial development inevitably damages historic districts.</p>`,
  },
  {
    sourceItemId: "section-diag-q5",
    questionNumber: 5,
    targetTimeSeconds: 65,
    difficulty: 2,
    questionType: "Weaken",
    stimulusText: `Archaeologists recently discovered ancient clay pots in Region X that perfectly match the highly specific geometric designs of pots found in Region Y. Since Region Y is known to have developed this unique artistic style several centuries earlier, the archaeologists conclude that traveling merchants from Region Y must have physically transported these specific pots to Region X.`,
    stemText:
      "Which one of the following, if true, most seriously weakens the archaeologists' conclusion?",
    choices: [
      {
        letter: "A",
        text: "Region X and Region Y were separated by a massive desert that was difficult for merchants to cross.",
        explanation:
          "This makes transport harder but does not disprove that the pots were transported; difficult travel is not impossible travel.",
      },
      {
        letter: "B",
        text: "The clay pots discovered in Region X were crafted from a type of local river mud that is completely unavailable anywhere near Region Y.",
        explanation:
          "If the pots were made from local materials, they were likely produced locally rather than physically transported from Region Y.",
      },
      {
        letter: "C",
        text: "Some ancient records indicate that merchants from Region X occasionally traveled to Region Y to trade spices.",
        explanation:
          "Merchants traveling from X to Y does not weaken the claim that Y-style pots arrived in X via Y merchants.",
      },
      {
        letter: "D",
        text: "The geometric designs found on the pots in Region Y are much more intricate than designs found in other neighboring regions.",
        explanation:
          "This reinforces the uniqueness of Region Y's style but does not challenge the transport conclusion.",
      },
      {
        letter: "E",
        text: "Ancient clay pots are highly fragile and easily broken during long-distance merchant travel.",
        explanation:
          "Fragility makes transport less likely but does not disprove it; intact pots could still have been transported carefully.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a causal/historical inference question where we need to weaken the conclusion.</p>
<ul>
<li><strong>Premise:</strong> Pots in Region X match the specific geometric designs of pots in Region Y.</li>
<li><strong>Premise:</strong> Region Y developed this style centuries earlier.</li>
<li><strong>Conclusion:</strong> Merchants from Region Y physically transported these specific pots to Region X.</li>
</ul>
<p>The archaeologists assume matching design means physical transport. An alternate explanation—that Region X potters copied the style locally—would weaken this conclusion.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. This makes transport harder but does not disprove that the pots were transported; difficult travel is not impossible travel.</p>
<p><strong>B)</strong> Correct. If the pots were made from local materials, they were likely produced locally rather than physically transported from Region Y.</p>
<p><strong>C)</strong> Incorrect. Merchants traveling from X to Y does not weaken the claim that Y-style pots arrived in X via Y merchants.</p>
<p><strong>D)</strong> Incorrect. This reinforces the uniqueness of Region Y's style but does not challenge the transport conclusion.</p>
<p><strong>E)</strong> Incorrect. Fragility makes transport less likely but does not disprove it; intact pots could still have been transported carefully.</p>`,
  },
  {
    sourceItemId: "section-diag-q6",
    questionNumber: 6,
    targetTimeSeconds: 70,
    difficulty: 3,
    questionType: "Role",
    stimulusText: `To reduce the city's overall carbon footprint, the mayor recently proposed a steep tax on all large delivery vehicles. However, this proposed tax will completely fail to achieve its environmental goal. The vast majority of delivery companies will simply pass the cost of the tax directly onto local consumers rather than taking on the expense of replacing their fleets with smaller, eco-friendly vehicles. Therefore, the city council ought to vote against the mayor's proposal.`,
    stemText:
      "Which one of the following most accurately describes the role played in the argument by the claim that the proposed tax will completely fail to achieve its environmental goal?",
    choices: [
      {
        letter: "A",
        text: "It is the main conclusion of the argument.",
        explanation:
          "The main conclusion is the recommendation that the city council vote against the proposal.",
      },
      {
        letter: "B",
        text: "It is a premise offered to demonstrate that delivery companies will pass the tax cost onto consumers.",
        explanation:
          "The causal direction is reversed; the claim about corporate behavior supports the failure claim, not the other way around.",
      },
      {
        letter: "C",
        text: "It is an intermediate conclusion that is supported by a claim about corporate behavior and that serves to support the argument's final recommendation.",
        explanation:
          "Corporate behavior supports the tax-failure claim, which in turn supports the recommendation to vote against the proposal.",
      },
      {
        letter: "D",
        text: "It is a principle that dictates why the city council should prioritize economic stability over environmental goals.",
        explanation:
          "The argument does not invoke a general principle about prioritizing economic stability.",
      },
      {
        letter: "E",
        text: "It is a phenomenon that the author attempts to explain by outlining the behavior of local consumers.",
        explanation:
          "The argument explains why the tax will fail using corporate behavior, not consumer behavior.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a Role question asking you to identify how a specific claim functions within the argument's structure.</p>
<ul>
<li><strong>Background:</strong> The mayor proposed a steep tax on large delivery vehicles to reduce carbon footprint.</li>
<li><strong>Intermediate Conclusion:</strong> The proposed tax will completely fail to achieve its environmental goal.</li>
<li><strong>Supporting Premise:</strong> Delivery companies will pass the cost to consumers rather than replace their fleets.</li>
<li><strong>Final Conclusion:</strong> The city council ought to vote against the mayor's proposal.</li>
</ul>
<p>The claim about the tax failing is neither the final conclusion nor a mere background premise. It is an intermediate conclusion supported by corporate behavior and used to justify the council's vote.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The main conclusion is the recommendation that the city council vote against the proposal.</p>
<p><strong>B)</strong> Incorrect. The causal direction is reversed; the claim about corporate behavior supports the failure claim, not the other way around.</p>
<p><strong>C)</strong> Correct. Corporate behavior supports the tax-failure claim, which in turn supports the recommendation to vote against the proposal.</p>
<p><strong>D)</strong> Incorrect. The argument does not invoke a general principle about prioritizing economic stability.</p>
<p><strong>E)</strong> Incorrect. The argument explains why the tax will fail using corporate behavior, not consumer behavior.</p>`,
  },
  {
    sourceItemId: "section-diag-q7",
    questionNumber: 7,
    targetTimeSeconds: 70,
    difficulty: 2,
    questionType: "Necessary Assumption",
    stimulusText: `The corporate office is transitioning from a traditional five-day schedule to a four-day workweek in an effort to boost employee morale. The human resources director claims that this schedule shift will not negatively impact the company's total weekly output. Since employees will be working fewer overall hours, they will be significantly more focused and efficient during the hours they are actually in the office.`,
    stemText:
      "The human resources director's argument requires which one of the following assumptions?",
    choices: [
      {
        letter: "A",
        text: "The transition to a four-day workweek will successfully boost employee morale as intended.",
        explanation:
          "The argument is about output, not morale; boosted morale is not required for the output claim to hold.",
      },
      {
        letter: "B",
        text: "Employees currently waste a significant portion of their five-day workweek on non-essential tasks.",
        explanation:
          "The argument does not require that employees currently waste time, only that increased efficiency will offset fewer hours.",
      },
      {
        letter: "C",
        text: "The increase in employee focus and efficiency will be sufficient to fully offset the reduction in total hours worked.",
        explanation:
          "Without this assumption, fewer hours worked would inevitably reduce total output, destroying the director's conclusion.",
      },
      {
        letter: "D",
        text: "Companies that maintain a five-day workweek generally suffer from lower employee morale.",
        explanation:
          "The argument does not compare morale across schedule types; it only needs the efficiency offset assumption.",
      },
      {
        letter: "E",
        text: "The company's total weekly output is the only metric the human resources director cares about.",
        explanation:
          "The director may care about other metrics; the argument only requires that output won't suffer.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a Necessary Assumption question. The right answer must be something the argument requires to survive; negating it destroys the conclusion.</p>
<ul>
<li><strong>Premise:</strong> The company is switching from five-day to four-day workweeks.</li>
<li><strong>Premise:</strong> Employees will work fewer total hours but be more focused and efficient.</li>
<li><strong>Conclusion:</strong> Total weekly output will not be negatively impacted.</li>
</ul>
<p>The Gap: The author assumes that increased efficiency per hour will fully compensate for the reduction in hours. If the efficiency gain is insufficient, output will drop.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The argument is about output, not morale; boosted morale is not required for the output claim to hold.</p>
<p><strong>B)</strong> Incorrect. The argument does not require that employees currently waste time, only that increased efficiency will offset fewer hours.</p>
<p><strong>C)</strong> Correct. Without this assumption, fewer hours worked would inevitably reduce total output, destroying the director's conclusion.</p>
<p><strong>D)</strong> Incorrect. The argument does not compare morale across schedule types; it only needs the efficiency offset assumption.</p>
<p><strong>E)</strong> Incorrect. The director may care about other metrics; the argument only requires that output won't suffer.</p>`,
  },
  {
    sourceItemId: "section-diag-q8",
    questionNumber: 8,
    targetTimeSeconds: 65,
    difficulty: 2,
    questionType: "Method of Reasoning",
    stimulusText: `Manager: Our main competitor recently launched a massive digital marketing campaign, and their quarterly sales immediately doubled. We should immediately redirect our print advertising budget into a similar digital marketing initiative to achieve the exact same sales boost.
Consultant: Your competitor's quarterly sales doubled because they drastically lowered their retail prices on their flagship products at the exact same time they launched that digital campaign.`,
    stemText:
      "The consultant responds to the manager's argument by doing which one of the following?",
    choices: [
      {
        letter: "A",
        text: "Demonstrating that the manager's proposed course of action will be financially ruinous.",
        explanation:
          "The consultant does not discuss the financial consequences of redirecting the advertising budget.",
      },
      {
        letter: "B",
        text: "Pointing out an alternate cause for the outcome the manager attributes to the digital marketing campaign.",
        explanation:
          "The consultant offers price cuts as an alternate explanation for the competitor's doubled sales.",
      },
      {
        letter: "C",
        text: "Questioning the accuracy of the sales data provided regarding the competitor's quarterly performance.",
        explanation:
          "The consultant accepts the sales data and offers a different causal explanation.",
      },
      {
        letter: "D",
        text: "Arguing that print advertising is generally more effective than digital marketing in their specific industry.",
        explanation:
          "The consultant does not compare the effectiveness of print versus digital advertising.",
      },
      {
        letter: "E",
        text: "Identifying a contradiction between the manager's stated goals and the manager's proposed actions.",
        explanation:
          "The consultant does not identify any internal contradiction in the manager's reasoning.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a Method of Reasoning question about how one speaker responds to another's causal argument.</p>
<ul>
<li><strong>Manager's Argument:</strong> Competitor launched digital marketing → sales doubled. Therefore, we should launch digital marketing to get the same boost.</li>
<li><strong>Consultant's Response:</strong> Sales doubled because of price cuts, not (or not solely because of) the digital campaign.</li>
</ul>
<p>The consultant challenges the manager's causal attribution by introducing an alternate cause for the observed outcome.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The consultant does not discuss the financial consequences of redirecting the advertising budget.</p>
<p><strong>B)</strong> Correct. The consultant offers price cuts as an alternate explanation for the competitor's doubled sales.</p>
<p><strong>C)</strong> Incorrect. The consultant accepts the sales data and offers a different causal explanation.</p>
<p><strong>D)</strong> Incorrect. The consultant does not compare the effectiveness of print versus digital advertising.</p>
<p><strong>E)</strong> Incorrect. The consultant does not identify any internal contradiction in the manager's reasoning.</p>`,
  },
  {
    sourceItemId: "section-diag-q9",
    questionNumber: 9,
    targetTimeSeconds: 85,
    difficulty: 3,
    questionType: "Resolve the Paradox",
    stimulusText: `Astronomers deployed a new satellite telescope optimized exclusively to detect faint, low-frequency radio waves from distant star systems. The scientific team expected a massive influx of new low-frequency data to analyze. Instead, the telescope's data feed is consistently flooded with high-intensity, high-frequency signals, while capturing almost zero low-frequency waves.`,
    stemText:
      "Which one of the following, if true, most helps to resolve the apparent paradox?",
    choices: [
      {
        letter: "A",
        text: "The distant star systems targeted by the telescope emit significantly more high-frequency radiation than low-frequency radiation.",
        explanation:
          "This explains why high-frequency signals exist but does not explain why the low-frequency sensors capture almost zero waves despite being optimized for them.",
      },
      {
        letter: "B",
        text: "The satellite's shielding material unexpectedly converts ambient high-frequency cosmic radiation into a concentrated internal signal that overwhelms the low-frequency sensors.",
        explanation:
          "This explains both the flood of high-frequency data and the failure of low-frequency sensors to capture expected signals.",
      },
      {
        letter: "C",
        text: "Earth's atmosphere naturally blocks most low-frequency radio waves from reaching surface-level observatories, which is why the satellite was launched into space.",
        explanation:
          "This explains why a satellite was needed but does not resolve why the satellite itself captures almost zero low-frequency waves.",
      },
      {
        letter: "D",
        text: "The scientific team previously utilized a different telescope that was capable of detecting both high and low-frequency waves simultaneously.",
        explanation:
          "Past telescope usage is irrelevant to explaining the current satellite's unexpected data pattern.",
      },
      {
        letter: "E",
        text: "Low-frequency radio waves degrade over vast cosmic distances much faster than high-frequency waves do.",
        explanation:
          "This might explain fewer low-frequency signals but does not explain the overwhelming high-frequency flood or sensor failure.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>A paradox question asks you to reconcile two facts that seem to contradict each other.</p>
<ul>
<li><strong>Fact 1:</strong> The telescope was optimized exclusively to detect faint, low-frequency radio waves.</li>
<li><strong>Fact 2:</strong> The team expected massive low-frequency data.</li>
<li><strong>Paradox:</strong> Instead, the feed is flooded with high-frequency signals while capturing almost zero low-frequency waves.</li>
</ul>
<p>We need an answer that explains why a low-frequency-optimized instrument produces the opposite of expected results.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. This explains why high-frequency signals exist but does not explain why the low-frequency sensors capture almost zero waves despite being optimized for them.</p>
<p><strong>B)</strong> Correct. This explains both the flood of high-frequency data and the failure of low-frequency sensors to capture expected signals.</p>
<p><strong>C)</strong> Incorrect. This explains why a satellite was needed but does not resolve why the satellite itself captures almost zero low-frequency waves.</p>
<p><strong>D)</strong> Incorrect. Past telescope usage is irrelevant to explaining the current satellite's unexpected data pattern.</p>
<p><strong>E)</strong> Incorrect. This might explain fewer low-frequency signals but does not explain the overwhelming high-frequency flood or sensor failure.</p>`,
  },
  {
    sourceItemId: "section-diag-q10",
    questionNumber: 10,
    targetTimeSeconds: 90,
    difficulty: 3,
    questionType: "Principle Application",
    stimulusText: `An art restorer ought never to permanently alter the original composition of a masterwork unless doing so is the only possible way to prevent the physical destruction of the piece.`,
    stemText:
      "Which one of the following actions clearly violates the principle stated above?",
    choices: [
      {
        letter: "A",
        text: "A restorer applies a temporary, water-soluble chemical wash to a 14th-century sculpture to remove decades of grime, leaving the original stone completely intact.",
        explanation:
          "This uses a temporary, reversible treatment that leaves the original composition intact.",
      },
      {
        letter: "B",
        text: "A restorer permanently re-weaves the backing of a medieval tapestry because an aggressive mold was actively dissolving the original threads.",
        explanation:
          "Permanent alteration is permitted when it is the only way to prevent physical destruction.",
      },
      {
        letter: "C",
        text: "A restorer paints over a faded section of a 16th-century canvas using permanent modern acrylics because the original artist's intended colors were no longer visible to museum patrons, although the canvas itself was structurally stable.",
        explanation:
          "The canvas was structurally stable, so permanent alteration for aesthetic reasons violates the principle.",
      },
      {
        letter: "D",
        text: "A restorer refuses to apply a permanent binding agent to a crumbling ancient vase because a newly developed, non-permanent resin can safely stabilize the clay.",
        explanation:
          "The restorer avoids permanent alteration when a non-permanent alternative exists, complying with the principle.",
      },
      {
        letter: "E",
        text: "A restorer places a fragile watercolor painting inside a permanent, vacuum-sealed glass case to stop the paper from disintegrating upon contact with the open air.",
        explanation:
          "Encasing the piece prevents destruction without permanently altering the original composition of the masterwork.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a Principle Application question. Find the scenario that violates every condition of the rule.</p>
<p>The Rule: Never permanently alter the original composition unless it is the only possible way to prevent physical destruction.</p>
<ul>
<li><strong>Prohibited:</strong> Permanent alteration of original composition for non-preservation reasons.</li>
<li><strong>Permitted exception:</strong> Permanent alteration when it is the only way to prevent physical destruction.</li>
</ul>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. This uses a temporary, reversible treatment that leaves the original composition intact.</p>
<p><strong>B)</strong> Incorrect. Permanent alteration is permitted when it is the only way to prevent physical destruction.</p>
<p><strong>C)</strong> Correct. The canvas was structurally stable, so permanent alteration for aesthetic reasons violates the principle.</p>
<p><strong>D)</strong> Incorrect. The restorer avoids permanent alteration when a non-permanent alternative exists, complying with the principle.</p>
<p><strong>E)</strong> Incorrect. Encasing the piece prevents destruction without permanently altering the original composition of the masterwork.</p>`,
  },
  {
    sourceItemId: "section-diag-q11",
    questionNumber: 11,
    targetTimeSeconds: 80,
    difficulty: 3,
    questionType: "Point at Issue",
    stimulusText: `Economist: The city should fund the new municipal subway line through a blanket property tax increase across all neighborhoods. A robust transit system benefits the entire local economy by reducing traffic and improving commerce, so every citizen should share the cost equally.
Urban Planner: The new subway line will drastically increase the property values of homes located within a mile of the new stations, while leaving property values in distant suburbs completely unaffected. Funding should be raised via a targeted tax applied solely to those nearby properties.`,
    stemText: "The economist and the urban planner disagree over whether",
    choices: [
      {
        letter: "A",
        text: "a robust transit system reduces traffic and improves commerce.",
        explanation:
          "Both speakers accept that transit benefits the economy; they disagree about how to fund it.",
      },
      {
        letter: "B",
        text: "the new municipal subway line will increase property values in distant suburbs.",
        explanation:
          "The urban planner states suburbs are unaffected, but this is not the core disagreement driving their funding proposals.",
      },
      {
        letter: "C",
        text: "the cost of funding the new subway line should be distributed equally among all property owners in the city.",
        explanation:
          "The economist supports equal distribution via blanket tax; the planner supports targeted taxation on nearby properties only.",
      },
      {
        letter: "D",
        text: "citizens who live within a mile of the new stations will use the subway more frequently than those in the suburbs.",
        explanation:
          "Neither speaker discusses relative frequency of subway use.",
      },
      {
        letter: "E",
        text: "targeted property taxes are generally more difficult to implement than blanket property taxes.",
        explanation:
          "Implementation difficulty is never discussed by either speaker.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a Point at Issue question. Identify what the two speakers explicitly disagree about.</p>
<ul>
<li><strong>Economist:</strong> Fund via blanket property tax across all neighborhoods because everyone benefits and should share costs equally.</li>
<li><strong>Urban Planner:</strong> Fund via targeted tax on properties within a mile of stations because they disproportionately benefit.</li>
</ul>
<p>Both agree transit helps the economy. They disagree on whether funding should be distributed equally among all property owners.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. Both speakers accept that transit benefits the economy; they disagree about how to fund it.</p>
<p><strong>B)</strong> Incorrect. The urban planner states suburbs are unaffected, but this is not the core disagreement driving their funding proposals.</p>
<p><strong>C)</strong> Correct. The economist supports equal distribution via blanket tax; the planner supports targeted taxation on nearby properties only.</p>
<p><strong>D)</strong> Incorrect. Neither speaker discusses relative frequency of subway use.</p>
<p><strong>E)</strong> Incorrect. Implementation difficulty is never discussed by either speaker.</p>`,
  },
  {
    sourceItemId: "section-diag-q12",
    questionNumber: 12,
    targetTimeSeconds: 75,
    difficulty: 2,
    questionType: "Most Strongly Supported",
    stimulusText: `In deep-sea hydrothermal vents, native tube worms completely lack a digestive tract. Instead, they rely entirely on specialized symbiotic bacteria living inside their bodies. These bacteria convert toxic hydrogen sulfide emitted from the vents into organic carbon, which directly nourishes the worms. If a vent becomes dormant and stops emitting hydrogen sulfide, these bacteria rapidly die off.`,
    stemText:
      "Which one of the following is most strongly supported by the information above?",
    choices: [
      {
        letter: "A",
        text: "Deep-sea tube worms are the only organisms that rely on symbiotic bacteria for survival.",
        explanation:
          "The stimulus describes tube worms specifically but makes no claim about other organisms.",
      },
      {
        letter: "B",
        text: "Without a continuous supply of hydrogen sulfide from the vents, the native tube worms don't survive.",
        explanation:
          "Worms depend entirely on bacteria that convert hydrogen sulfide; when vents go dormant and bacteria die, the worms lose their sole source of nourishment.",
      },
      {
        letter: "C",
        text: "The symbiotic bacteria living inside the tube worms can survive in environments other than hydrothermal vents.",
        explanation:
          "The bacteria die off when hydrogen sulfide stops, suggesting they cannot survive without vent emissions.",
      },
      {
        letter: "D",
        text: "When a hydrothermal vent becomes dormant, the native tube worms develop a traditional digestive tract.",
        explanation:
          "Nothing in the stimulus suggests worms develop digestive tracts when vents go dormant.",
      },
      {
        letter: "E",
        text: "Hydrogen sulfide is toxic to all marine life except for the deep-sea tube worms and their symbiotic bacteria.",
        explanation:
          "The stimulus says hydrogen sulfide is toxic but converted by bacteria; it does not claim only these organisms can tolerate it.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a Most Strongly Supported question requiring synthesis of biological dependencies.</p>
<ul>
<li><strong>Fact 1:</strong> Tube worms lack digestive tracts and rely entirely on symbiotic bacteria.</li>
<li><strong>Fact 2:</strong> Bacteria convert hydrogen sulfide from vents into organic carbon that nourishes the worms.</li>
<li><strong>Fact 3:</strong> When vents go dormant and stop emitting hydrogen sulfide, the bacteria rapidly die off.</li>
</ul>
<p>Chain of dependency: worms → bacteria → hydrogen sulfide from vents. If hydrogen sulfide stops, bacteria die, and worms lose their only nourishment source.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The stimulus describes tube worms specifically but makes no claim about other organisms.</p>
<p><strong>B)</strong> Correct. Worms depend entirely on bacteria that convert hydrogen sulfide; when vents go dormant and bacteria die, the worms lose their sole source of nourishment.</p>
<p><strong>C)</strong> Incorrect. The bacteria die off when hydrogen sulfide stops, suggesting they cannot survive without vent emissions.</p>
<p><strong>D)</strong> Incorrect. Nothing in the stimulus suggests worms develop digestive tracts when vents go dormant.</p>
<p><strong>E)</strong> Incorrect. The stimulus says hydrogen sulfide is toxic but converted by bacteria; it does not claim only these organisms can tolerate it.</p>`,
  },
  {
    sourceItemId: "section-diag-q13",
    questionNumber: 13,
    targetTimeSeconds: 90,
    difficulty: 3,
    questionType: "Weaken",
    stimulusText: `The tech company recently removed all traditional cubicles and transitioned its headquarters to an "open-plan" office layout. Since the transition, internal server data shows that employees are sending forty percent fewer emails to their colleagues. Management concludes that the open-plan office has successfully fostered a more direct, face-to-face collaborative environment among the floor staff.`,
    stemText:
      "Which one of the following, if true, most seriously weakens management's conclusion?",
    choices: [
      {
        letter: "A",
        text: "The tech company recently hired several new managers who prefer face-to-face meetings over long email chains.",
        explanation:
          "New managers preferring face-to-face meetings could support rather than weaken the collaboration conclusion.",
      },
      {
        letter: "B",
        text: "The total volume of emails sent to clients outside of the tech company has remained exactly the same since the transition.",
        explanation:
          "External email volume is irrelevant to whether internal communication shifted to face-to-face collaboration.",
      },
      {
        letter: "C",
        text: "Since the open-plan office was implemented, employees have begun wearing noise-canceling headphones and communicating through a newly installed, silent instant-messaging software to avoid disturbing others.",
        explanation:
          "Employees switched to silent messaging rather than face-to-face talk, providing an alternate explanation for fewer emails.",
      },
      {
        letter: "D",
        text: "Several competing tech companies have also adopted open-plan offices to encourage staff collaboration.",
        explanation:
          "What competitors do does not weaken the causal claim about this company's internal communication.",
      },
      {
        letter: "E",
        text: "Employees reported feeling slightly more distracted by background noise during their first week in the open-plan office.",
        explanation:
          "Initial distraction reports do not explain the sustained drop in internal emails or disprove face-to-face collaboration.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a causal argument where we need to weaken the conclusion.</p>
<ul>
<li><strong>Premise:</strong> The company transitioned to an open-plan office.</li>
<li><strong>Premise:</strong> Internal emails to colleagues dropped 40%.</li>
<li><strong>Conclusion:</strong> The open-plan layout fostered more direct, face-to-face collaboration.</li>
</ul>
<p>The management assumes fewer emails means more face-to-face interaction. An alternate explanation for fewer emails would weaken this causal link.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. New managers preferring face-to-face meetings could support rather than weaken the collaboration conclusion.</p>
<p><strong>B)</strong> Incorrect. External email volume is irrelevant to whether internal communication shifted to face-to-face collaboration.</p>
<p><strong>C)</strong> Correct. Employees switched to silent messaging rather than face-to-face talk, providing an alternate explanation for fewer emails.</p>
<p><strong>D)</strong> Incorrect. What competitors do does not weaken the causal claim about this company's internal communication.</p>
<p><strong>E)</strong> Incorrect. Initial distraction reports do not explain the sustained drop in internal emails or disprove face-to-face collaboration.</p>`,
  },
  {
    sourceItemId: "section-diag-q14",
    questionNumber: 14,
    targetTimeSeconds: 90,
    difficulty: 3,
    questionType: "Flaw",
    stimulusText: `Historian: Some scholars argue that the ancient Chola script was used primarily for everyday accounting and trade purposes, pointing to the sheer abundance of small, inscribed ledger tablets found in the southern valley. However, our archaeological team recently discovered a massive, ceremonial stone monument in the northern highlands inscribed with a highly stylized Chola script poem celebrating a royal military victory. Therefore, the scholars are wrong; the Chola script was never used for everyday accounting purposes.`,
    stemText: "The historian's reasoning is flawed because it",
    choices: [
      {
        letter: "A",
        text: "presumes, without providing justification, that the poem inscribed on the monument is historically accurate.",
        explanation:
          "The historian's flaw is about script usage, not the historical accuracy of the poem's content.",
      },
      {
        letter: "B",
        text: "takes evidence showing that a script was used for one specific purpose as proof that it was not used for another, entirely different purpose.",
        explanation:
          "Finding ceremonial use does not disprove everyday accounting use; a script can serve multiple purposes.",
      },
      {
        letter: "C",
        text: "attacks the scholars' credentials rather than addressing the physical evidence of the ledger tablets.",
        explanation:
          "The historian does not attack the scholars personally; they cite new archaeological evidence.",
      },
      {
        letter: "D",
        text: "assumes that everyday accounting and trade were not important aspects of the ancient Chola society.",
        explanation:
          "The historian never claims accounting was unimportant; they claim the script was never used for it.",
      },
      {
        letter: "E",
        text: "fails to consider that the massive stone monument might have been carved by a society other than the Chola.",
        explanation:
          "The monument is described as inscribed with Chola script; the flaw is the either/or reasoning about usage.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a flaw question about improper exclusion from evidence of one use case.</p>
<ul>
<li><strong>Scholars' Claim:</strong> Chola script was used primarily for everyday accounting and trade (supported by ledger tablets).</li>
<li><strong>Historian's Evidence:</strong> A ceremonial monument with a stylized Chola script poem was discovered.</li>
<li><strong>Historian's Conclusion:</strong> The scholars are wrong; the script was never used for accounting.</li>
</ul>
<p>The Flaw: Proving a script was used for ceremonial purposes does not prove it was never used for accounting. Multiple uses can coexist.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The historian's flaw is about script usage, not the historical accuracy of the poem's content.</p>
<p><strong>B)</strong> Correct. Finding ceremonial use does not disprove everyday accounting use; a script can serve multiple purposes.</p>
<p><strong>C)</strong> Incorrect. The historian does not attack the scholars personally; they cite new archaeological evidence.</p>
<p><strong>D)</strong> Incorrect. The historian never claims accounting was unimportant; they claim the script was never used for it.</p>
<p><strong>E)</strong> Incorrect. The monument is described as inscribed with Chola script; the flaw is the either/or reasoning about usage.</p>`,
  },
  {
    sourceItemId: "section-diag-q15",
    questionNumber: 15,
    targetTimeSeconds: 100,
    difficulty: 4,
    questionType: "Necessary Assumption",
    stimulusText: `An agricultural firm developed a new bio-pesticide that completely protects corn crops from the destructive root-borer insect without harming beneficial soil microbes. Traditional chemical pesticides eradicate the root-borer but severely deplete these microbes, which are essential for maximizing the corn's nutrient absorption. Therefore, farmers who switch from the traditional chemical pesticide to the new bio-pesticide will undoubtedly see a significant increase in their overall corn crop yield.`,
    stemText: "The argument requires which one of the following assumptions?",
    choices: [
      {
        letter: "A",
        text: "The root-borer insect is the greatest threat to corn crop yields in the region.",
        explanation:
          "The argument does not require the root-borer to be the greatest threat, only that preserving microbes will boost yields.",
      },
      {
        letter: "B",
        text: "The new bio-pesticide is less expensive for farmers to purchase and apply than traditional chemical pesticides.",
        explanation:
          "Cost is irrelevant to the yield argument, which is based on microbe preservation and nutrient absorption.",
      },
      {
        letter: "C",
        text: "The new bio-pesticide does not contain chemicals that directly inhibit the corn plant's ability to absorb nutrients from the soil.",
        explanation:
          "If the bio-pesticide itself inhibits nutrient absorption, switching would not guarantee increased yields.",
      },
      {
        letter: "D",
        text: "Beneficial soil microbes are incapable of surviving in soil that has been treated with any type of chemical synthetic.",
        explanation:
          "The argument compares two pesticide types; it does not require microbes to be unable to survive any chemical treatment.",
      },
      {
        letter: "E",
        text: "Farmers who currently use traditional chemical pesticides are dissatisfied with their overall corn crop yields.",
        explanation:
          "Farmer satisfaction is not required; the argument predicts yield increases regardless of current satisfaction.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a Necessary Assumption question about a predicted agricultural outcome.</p>
<ul>
<li><strong>Premise:</strong> Bio-pesticide protects corn from root-borer without harming beneficial soil microbes.</li>
<li><strong>Premise:</strong> Chemical pesticides deplete microbes essential for maximizing nutrient absorption.</li>
<li><strong>Conclusion:</strong> Switching to bio-pesticide will cause a significant increase in corn crop yield.</li>
</ul>
<p>The Gap: The author assumes the yield benefit from preserved microbes is not offset by any other negative effect of the bio-pesticide on the corn itself.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The argument does not require the root-borer to be the greatest threat, only that preserving microbes will boost yields.</p>
<p><strong>B)</strong> Incorrect. Cost is irrelevant to the yield argument, which is based on microbe preservation and nutrient absorption.</p>
<p><strong>C)</strong> Correct. If the bio-pesticide itself inhibits nutrient absorption, switching would not guarantee increased yields.</p>
<p><strong>D)</strong> Incorrect. The argument compares two pesticide types; it does not require microbes to be unable to survive any chemical treatment.</p>
<p><strong>E)</strong> Incorrect. Farmer satisfaction is not required; the argument predicts yield increases regardless of current satisfaction.</p>`,
  },
  {
    sourceItemId: "section-diag-q16",
    questionNumber: 16,
    targetTimeSeconds: 120,
    difficulty: 5,
    questionType: "Parallel Flaw",
    stimulusText: `Corporate Policy: Anyone who possesses a red security badge is explicitly authorized to access the server room. Mark currently possesses a red security badge. Therefore, if Mark's red security badge is permanently deactivated tomorrow, he will no longer be authorized to access the server room.`,
    stemText:
      "Which one of the following arguments exhibits a flawed pattern of reasoning most strictly parallel to that of the argument above?",
    choices: [
      {
        letter: "A",
        text: "All properties equipped with solar panels are eligible for the city's green energy tax credit. The Smith residence is equipped with solar panels. Therefore, if the Smith residence removes its solar panels, it will no longer be eligible for the green energy tax credit.",
        explanation:
          "Both arguments treat a sufficient condition for eligibility as if it were necessary, concluding that losing the condition means losing eligibility.",
      },
      {
        letter: "B",
        text: "Anyone who completes the advanced driver's training course receives a discount on their auto insurance. Sarah received a discount on her auto insurance. Therefore, Sarah must have completed the advanced driver's training course.",
        explanation:
          "This is affirming the consequent, reversing the direction of the flaw in the stimulus.",
      },
      {
        letter: "C",
        text: "If a restaurant passes its municipal health inspection, it is allowed to remain open. The downtown diner failed its health inspection. Therefore, the downtown diner will be forced to close.",
        explanation:
          "This is valid modus tollens reasoning, not the same flaw as the stimulus.",
      },
      {
        letter: "D",
        text: "All registered voters are allowed to participate in the upcoming mayoral election. John is not a registered voter. Therefore, if John registers to vote tomorrow, he will be allowed to participate in the election.",
        explanation:
          "This is valid reasoning about gaining a sufficient condition, not parallel to the stimulus flaw.",
      },
      {
        letter: "E",
        text: "Any student who maintains a perfect grade point average earns a spot on the dean's list. Leo is on the dean's list. Therefore, if Leo's grade point average drops, he will be removed from the dean's list.",
        explanation:
          "This starts from membership on the list rather than possession of the qualifying condition, making the structure different.",
      },
    ],
    correctAnswer: "A",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a Parallel Flaw question requiring you to match the structural logical error.</p>
<ul>
<li><strong>Rule:</strong> Red Badge → Authorized (badge possession is sufficient for authorization).</li>
<li><strong>Premise:</strong> Mark has a red badge.</li>
<li><strong>Conclusion:</strong> If badge deactivated → no longer authorized.</li>
</ul>
<p>The Flaw: The policy states that having a badge is sufficient for authorization, but not that it is necessary. Mark might remain authorized through other means. The argument illegitimately derives a necessary condition from a sufficient one.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Correct. Both arguments treat a sufficient condition for eligibility as if it were necessary, concluding that losing the condition means losing eligibility.</p>
<p><strong>B)</strong> Incorrect. This is affirming the consequent, reversing the direction of the flaw in the stimulus.</p>
<p><strong>C)</strong> Incorrect. This is valid modus tollens reasoning, not the same flaw as the stimulus.</p>
<p><strong>D)</strong> Incorrect. This is valid reasoning about gaining a sufficient condition, not parallel to the stimulus flaw.</p>
<p><strong>E)</strong> Incorrect. This starts from membership on the list rather than possession of the qualifying condition, making the structure different.</p>`,
  },
  {
    sourceItemId: "section-diag-q17",
    questionNumber: 17,
    targetTimeSeconds: 105,
    difficulty: 4,
    questionType: "Sufficient Assumption",
    stimulusText: `Art Historian: Any painting that utilizes genuine lapis lazuli pigment was painted prior to the 19th century. Furthermore, absolutely no painting created prior to the 19th century features the abstract geometric style. Therefore, the recently discovered painting titled Azure Dreams does not utilize genuine lapis lazuli pigment.`,
    stemText:
      "Which one of the following, if assumed, allows the conclusion to be properly drawn?",
    choices: [
      {
        letter: "A",
        text: "The recently discovered painting Azure Dreams was created by an artist known to avoid using lapis lazuli.",
        explanation:
          "The artist's preferences do not logically connect to the conditional rules about lapis lazuli and time periods.",
      },
      {
        letter: "B",
        text: "No painting created in the 19th century or later utilizes genuine lapis lazuli pigment.",
        explanation:
          "This restates part of Premise 1 but does not connect Azure Dreams to the abstract geometric style rule.",
      },
      {
        letter: "C",
        text: "The recently discovered painting Azure Dreams features the abstract geometric style.",
        explanation:
          "If Azure Dreams has abstract geometric style, it cannot be pre-19th century, and therefore cannot use genuine lapis lazuli.",
      },
      {
        letter: "D",
        text: "If a painting does not feature the abstract geometric style, it must have been painted prior to the 19th century.",
        explanation:
          "This reverses Premise 2 and does not help prove Azure Dreams lacks lapis lazuli.",
      },
      {
        letter: "E",
        text: "Some aspects of the recently discovered painting Azure Dreams were painted using synthetic blue pigments rather than genuine lapis lazuli.",
        explanation:
          "Using synthetic pigments in some areas does not prove the painting as a whole does not utilize genuine lapis lazuli.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a Sufficient Assumption question requiring a premise that proves the conclusion with certainty.</p>
<ul>
<li><strong>Premise 1:</strong> Lapis Lazuli → Prior to 19th Century</li>
<li><strong>Premise 2:</strong> Prior to 19th Century → /Abstract Geometric Style (contrapositive: Abstract Geometric → Not Prior to 19th Century)</li>
<li><strong>Conclusion:</strong> Azure Dreams → /Lapis Lazuli</li>
</ul>
<p>The Gap: We need to connect Azure Dreams to the chain. If Azure Dreams features abstract geometric style, it cannot be pre-19th century, and therefore cannot use genuine lapis lazuli.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The artist's preferences do not logically connect to the conditional rules about lapis lazuli and time periods.</p>
<p><strong>B)</strong> Incorrect. This restates part of Premise 1 but does not connect Azure Dreams to the abstract geometric style rule.</p>
<p><strong>C)</strong> Correct. If Azure Dreams has abstract geometric style, it cannot be pre-19th century, and therefore cannot use genuine lapis lazuli.</p>
<p><strong>D)</strong> Incorrect. This reverses Premise 2 and does not help prove Azure Dreams lacks lapis lazuli.</p>
<p><strong>E)</strong> Incorrect. Using synthetic pigments in some areas does not prove the painting as a whole does not utilize genuine lapis lazuli.</p>`,
  },
  {
    sourceItemId: "section-diag-q18",
    questionNumber: 18,
    targetTimeSeconds: 105,
    difficulty: 4,
    questionType: "Flaw",
    stimulusText: `City Transit Director: Critics claim our newly implemented express bus route is a failure, but it is actually highly efficient. Data proves that a vast majority of the passengers who ride the new express route arrive at their downtown destinations twenty percent faster than they would have on the old local route.
Citizen Advocate: That is completely misleading. The express route achieves that speed exclusively by bypassing the city's lower-income districts, depriving thousands of residents of their only reliable method of public transportation. Therefore, the new express route is not highly efficient at all.`,
    stemText: "The citizen advocate's reasoning is flawed because it",
    choices: [
      {
        letter: "A",
        text: "attacks the transit director's personal character rather than addressing the speed data provided.",
        explanation:
          "The advocate challenges the director's claim but does not attack the director's character.",
      },
      {
        letter: "B",
        text: "treats a condition that is sufficient to make a transit system efficient as a condition that is necessary for it to be efficient.",
        explanation:
          "The advocate does not confuse sufficient and necessary conditions for efficiency.",
      },
      {
        letter: "C",
        text: "relies on a shifting definition of the term \"efficient\" to refute the transit director's claim.",
        explanation:
          "The director uses efficiency to mean speed; the advocate shifts to equitable access, redefining the term mid-argument.",
      },
      {
        letter: "D",
        text: "fails to consider that the old local route might have been even less reliable for the residents of the lower-income districts.",
        explanation:
          "The reliability of the old route is not the logical flaw in the advocate's reasoning.",
      },
      {
        letter: "E",
        text: "bases a sweeping conclusion about the entire public transportation system on a single, unrepresentative bus route.",
        explanation:
          "The advocate's conclusion is about the express route specifically, not the entire system.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a flaw question about equivocation or shifting definitions.</p>
<ul>
<li><strong>Director's Claim:</strong> The express route is highly efficient because passengers arrive 20% faster.</li>
<li><strong>Advocate's Response:</strong> The route bypasses lower-income districts, depriving residents of transportation. Therefore, it is not efficient at all.</li>
</ul>
<p>The Flaw: The director defines "efficient" as speed for riders on the route. The advocate redefines "efficient" to include equitable service access, then rejects the director's claim using this different definition.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The advocate challenges the director's claim but does not attack the director's character.</p>
<p><strong>B)</strong> Incorrect. The advocate does not confuse sufficient and necessary conditions for efficiency.</p>
<p><strong>C)</strong> Correct. The director uses efficiency to mean speed; the advocate shifts to equitable access, redefining the term mid-argument.</p>
<p><strong>D)</strong> Incorrect. The reliability of the old route is not the logical flaw in the advocate's reasoning.</p>
<p><strong>E)</strong> Incorrect. The advocate's conclusion is about the express route specifically, not the entire system.</p>`,
  },
  {
    sourceItemId: "section-diag-q19",
    questionNumber: 19,
    targetTimeSeconds: 110,
    difficulty: 4,
    questionType: "Parallel Reasoning",
    stimulusText: `If the patient had a severe biological allergy to peanuts, she would have immediately experienced anaphylaxis after eating the provided trail mix. However, the medical charts confirm she did not experience anaphylaxis. Therefore, since the trail mix definitely contained heavily roasted peanuts, the patient must not have a severe biological allergy to peanuts.`,
    stemText:
      "Which one of the following arguments exhibits a pattern of reasoning most parallel to that of the argument above?",
    choices: [
      {
        letter: "A",
        text: "If the manuscript were a genuine medieval artifact, the ink would have faded under ultraviolet light. The ink did fade under ultraviolet light. Therefore, since the parchment is definitely centuries old, the manuscript must be a genuine medieval artifact.",
        explanation:
          "This affirms the consequent rather than denying it, reversing the stimulus pattern.",
      },
      {
        letter: "B",
        text: "If the car's engine had a cracked block, the vehicle would have overheated during the steep mountain climb. The vehicle did not overheat during a climb. Therefore, since the car was definitively driven up the steep mountain, the engine must not have a cracked block.",
        explanation:
          "This matches modus tollens: If X then Y; not Y; therefore not X, with a confirming condition that the trigger event occurred.",
      },
      {
        letter: "C",
        text: "If the software update had been properly tested, it would not have caused the servers to crash. The servers crashed immediately after the update. Therefore, the software update must not have been properly tested.",
        explanation:
          "This denies the antecedent from a failed consequent but lacks the confirming condition structure of the stimulus.",
      },
      {
        letter: "D",
        text: "If the vault had been breached by a professional thief, the alarm wires would have been cleanly cut. The alarm wires were not cleanly cut. Therefore, the vault was likely breached by an amateur.",
        explanation:
          "This draws a different conclusion about an alternate cause rather than denying the original condition.",
      },
      {
        letter: "E",
        text: "If the river floods, the nearby crops will be destroyed. The crops were completely destroyed. Therefore, since the valley experienced heavy rainfall, the river must have flooded.",
        explanation:
          "This affirms the consequent to conclude the antecedent, the reverse of the stimulus pattern.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a Parallel Reasoning question. Abstract the logical structure and find a matching pattern.</p>
<ul>
<li><strong>Structure:</strong> If Allergy → Anaphylaxis. Not Anaphylaxis. Trail mix had peanuts (trigger present). Therefore, Not Allergy.</li>
<li><strong>Pattern:</strong> If X → Y. Not Y. Trigger condition confirmed. Therefore, Not X. (Modus tollens with confirming context)</li>
</ul>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. This affirms the consequent rather than denying it, reversing the stimulus pattern.</p>
<p><strong>B)</strong> Correct. This matches modus tollens: If X then Y; not Y; therefore not X, with a confirming condition that the trigger event occurred.</p>
<p><strong>C)</strong> Incorrect. This denies the antecedent from a failed consequent but lacks the confirming condition structure of the stimulus.</p>
<p><strong>D)</strong> Incorrect. This draws a different conclusion about an alternate cause rather than denying the original condition.</p>
<p><strong>E)</strong> Incorrect. This affirms the consequent to conclude the antecedent, the reverse of the stimulus pattern.</p>`,
  },
  {
    sourceItemId: "section-diag-q20",
    questionNumber: 20,
    targetTimeSeconds: 105,
    difficulty: 4,
    questionType: "Weaken",
    stimulusText: `Economic Historian: In the 18th century, the coastal town of Portalis enacted a strict ban on the import of all foreign textiles. Archival records show that within two years of the ban being implemented, the number of registered local weaving guilds in Portalis tripled. Clearly, the ban successfully protected the local textile economy, allowing domestic weavers to flourish by eliminating cheap foreign competition.`,
    stemText:
      "Which one of the following, if true, most seriously weakens the economic historian's argument?",
    choices: [
      {
        letter: "A",
        text: "Following the ban, the price of locally produced textiles in Portalis rose significantly, making them unaffordable for the poorest residents.",
        explanation:
          "Higher prices suggest the ban had economic effects but do not directly undermine the claim that domestic weavers flourished.",
      },
      {
        letter: "B",
        text: "Many of the newly registered \"weaving guilds\" were actually shell organizations created by smugglers to secretly distribute illegally imported foreign textiles under the guise of domestic production.",
        explanation:
          "If new guilds were smuggling fronts, the tripling of registrations does not reflect genuine domestic weaving growth.",
      },
      {
        letter: "C",
        text: "Prior to the ban, foreign textiles accounted for less than twenty percent of all fabric purchased in Portalis.",
        explanation:
          "Even a small foreign share could be significant; this does not seriously weaken the causal claim.",
      },
      {
        letter: "D",
        text: "The neighboring town of Veridia did not ban foreign textiles, and its local weaving guilds entirely collapsed during the same two-year period.",
        explanation:
          "Veridia's collapse could actually support the historian's claim about the ban's protective effect.",
      },
      {
        letter: "E",
        text: "The harsh penalties for importing foreign textiles deterred merchants from bringing other, completely legal luxury goods into the port of Portalis.",
        explanation:
          "Effects on other luxury goods are irrelevant to whether the ban protected the local textile economy.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a causal historical argument where we need to weaken the conclusion.</p>
<ul>
<li><strong>Premise:</strong> Portalis banned foreign textile imports.</li>
<li><strong>Premise:</strong> Registered local weaving guilds tripled within two years.</li>
<li><strong>Conclusion:</strong> The ban protected the local textile economy, allowing domestic weavers to flourish.</li>
</ul>
<p>The historian assumes guild registrations reflect genuine domestic weaving growth. An alternate explanation for the registration increase would weaken this causal link.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. Higher prices suggest the ban had economic effects but do not directly undermine the claim that domestic weavers flourished.</p>
<p><strong>B)</strong> Correct. If new guilds were smuggling fronts, the tripling of registrations does not reflect genuine domestic weaving growth.</p>
<p><strong>C)</strong> Incorrect. Even a small foreign share could be significant; this does not seriously weaken the causal claim.</p>
<p><strong>D)</strong> Incorrect. Veridia's collapse could actually support the historian's claim about the ban's protective effect.</p>
<p><strong>E)</strong> Incorrect. Effects on other luxury goods are irrelevant to whether the ban protected the local textile economy.</p>`,
  },
  {
    sourceItemId: "section-diag-q21",
    questionNumber: 21,
    targetTimeSeconds: 90,
    difficulty: 4,
    questionType: "Resolve the Paradox",
    stimulusText: `To combat a rampant and dangerous mosquito population, the county introduced a large number of native brown bats, which are known to be voracious natural predators of mosquitoes. A year later, biological surveys confirmed that the bat population had thrived and expanded its territory across the county. Yet, the county's mosquito population was actually significantly larger than it had been before the bats were introduced.`,
    stemText:
      "Which one of the following, if true, most helps to resolve the apparent paradox?",
    choices: [
      {
        letter: "A",
        text: "Brown bats primarily hunt during the twilight hours, which is also the time when mosquitoes are most active.",
        explanation:
          "Overlapping activity hours would suggest bats should catch more mosquitoes, not explain why mosquito populations grew.",
      },
      {
        letter: "B",
        text: "The county simultaneously banned the use of a harsh chemical pesticide that had previously kept the mosquito population lower than it should be.",
        explanation:
          "This explains a mosquito increase but does not account for why bat introduction failed to counteract it given thriving bat populations.",
      },
      {
        letter: "C",
        text: "The introduced brown bats prey heavily on a specific type of airborne dragonfly that is the primary natural predator of mosquito larvae.",
        explanation:
          "Bats reduced dragonfly populations, removing a key check on mosquito larvae and allowing mosquito numbers to surge despite bat predation.",
      },
      {
        letter: "D",
        text: "Mosquitoes are capable of reproducing at a much faster rate than brown bats.",
        explanation:
          "Reproduction rates alone do not explain why mosquito populations grew after introducing a known predator.",
      },
      {
        letter: "E",
        text: "The brown bats found several alternative food sources in the county, such as moths and beetles, reducing their reliance on mosquitoes.",
        explanation:
          "Alternative food sources might reduce bat predation on mosquitoes but do not fully explain a significant population increase.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>A paradox question asking you to reconcile conflicting ecological outcomes.</p>
<ul>
<li><strong>Fact 1:</strong> Brown bats (mosquito predators) were introduced to combat mosquitoes.</li>
<li><strong>Fact 2:</strong> Bat population thrived and expanded.</li>
<li><strong>Paradox:</strong> Mosquito population became significantly larger than before bat introduction.</li>
</ul>
<p>We need an answer explaining how increased bat presence could coincidentally lead to more mosquitoes, not fewer.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. Overlapping activity hours would suggest bats should catch more mosquitoes, not explain why mosquito populations grew.</p>
<p><strong>B)</strong> Incorrect. This explains a mosquito increase but does not account for why bat introduction failed to counteract it given thriving bat populations.</p>
<p><strong>C)</strong> Correct. Bats reduced dragonfly populations, removing a key check on mosquito larvae and allowing mosquito numbers to surge despite bat predation.</p>
<p><strong>D)</strong> Incorrect. Reproduction rates alone do not explain why mosquito populations grew after introducing a known predator.</p>
<p><strong>E)</strong> Incorrect. Alternative food sources might reduce bat predation on mosquitoes but do not fully explain a significant population increase.</p>`,
  },
  {
    sourceItemId: "section-diag-q22",
    questionNumber: 22,
    targetTimeSeconds: 80,
    difficulty: 3,
    questionType: "Evaluate the Argument",
    stimulusText: `Technology Executive: We must immediately transition our entire corporate network to the newly released 'Titan' operating system. Titan features advanced, military-grade data encryption that is mathematically impossible for current hackers to crack. By completing this transition, our firm will significantly decrease the massive number of external data breaches it suffers each year.`,
    stemText:
      "The answer to which one of the following questions is most relevant in evaluating the technology executive's argument?",
    choices: [
      {
        letter: "A",
        text: "Is the 'Titan' operating system significantly more expensive to license than the firm's current operating system?",
        explanation:
          "Cost is relevant to the decision but not to evaluating whether the transition will reduce breaches.",
      },
      {
        letter: "B",
        text: "Have any other firms in the same industry recently transitioned to the 'Titan' operating system?",
        explanation:
          "Other firms' choices do not directly evaluate whether Titan will reduce this firm's breaches.",
      },
      {
        letter: "C",
        text: "Will the transition process require the network to be temporarily taken offline during business hours?",
        explanation:
          "Downtime during transition is an implementation concern, not central to evaluating breach reduction.",
      },
      {
        letter: "D",
        text: "Were the majority of the firm's past external data breaches the result of employees falling victim to social engineering tactics that bypass data encryption?",
        explanation:
          "If breaches bypass encryption via social engineering, upgrading encryption alone may not reduce breaches.",
      },
      {
        letter: "E",
        text: "Does the 'Titan' operating system offer any productivity features beyond its military-grade data encryption?",
        explanation:
          "Extra productivity features are irrelevant to whether the encryption upgrade will reduce data breaches.",
      },
    ],
    correctAnswer: "D",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is an Evaluate the Argument question. Find the question whose answer would most help assess whether the conclusion is sound.</p>
<ul>
<li><strong>Premise:</strong> Titan OS has unbreakable military-grade encryption.</li>
<li><strong>Conclusion:</strong> Transitioning to Titan will significantly decrease external data breaches.</li>
</ul>
<p>The argument assumes past breaches were caused by insufficient encryption. If breaches resulted from social engineering that bypasses encryption, the transition may not help.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. Cost is relevant to the decision but not to evaluating whether the transition will reduce breaches.</p>
<p><strong>B)</strong> Incorrect. Other firms' choices do not directly evaluate whether Titan will reduce this firm's breaches.</p>
<p><strong>C)</strong> Incorrect. Downtime during transition is an implementation concern, not central to evaluating breach reduction.</p>
<p><strong>D)</strong> Correct. If breaches bypass encryption via social engineering, upgrading encryption alone may not reduce breaches.</p>
<p><strong>E)</strong> Incorrect. Extra productivity features are irrelevant to whether the encryption upgrade will reduce data breaches.</p>`,
  },
  {
    sourceItemId: "section-diag-q23",
    questionNumber: 23,
    targetTimeSeconds: 80,
    difficulty: 4,
    questionType: "Method of Reasoning",
    stimulusText: `Professor: The sudden collapse of the Bronze Age civilization of Myra was undoubtedly caused by a catastrophic, decades-long drought. This is clearly evidenced by the widespread, sudden abandonment of their advanced agricultural settlements during that era.
Graduate Student: But recent tree-ring data from the Myra valley covering that exact time period shows that the region actually experienced higher-than-average rainfall. The settlements were likely abandoned due to the invading coastal raiders, whose distinct bronze weaponry we recently unearthed in the settlement ruins.`,
    stemText:
      "The graduate student responds to the professor's argument by doing which one of the following?",
    choices: [
      {
        letter: "A",
        text: "Presenting new physical evidence that contradicts the fact used to support the professor's conclusion.",
        explanation:
          "Tree-ring data showing higher-than-average rainfall directly contradicts the drought evidence the professor relied on.",
      },
      {
        letter: "B",
        text: "Identifying a logical inconsistency within the professor's explanation of why the agricultural settlements were abandoned.",
        explanation:
          "The student does not identify an internal logical inconsistency; they challenge the environmental evidence.",
      },
      {
        letter: "C",
        text: "Questioning the reliability of the archaeological methods used to determine the exact date of the agricultural settlements.",
        explanation:
          "The student does not question dating methods; they offer contradictory environmental data and an alternate cause.",
      },
      {
        letter: "D",
        text: "Arguing that the professor has confused a necessary condition for societal collapse with a sufficient one.",
        explanation:
          "The student does not analyze conditional logic; they present contradictory evidence and an alternate cause.",
      },
      {
        letter: "E",
        text: "Suggesting an alternate cause for a historical phenomenon while completely accepting the environmental data the professor cited.",
        explanation:
          "The student rejects the professor's environmental data rather than accepting it while offering an alternate cause.",
      },
    ],
    correctAnswer: "A",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a Method of Reasoning question about how the graduate student responds to the professor.</p>
<ul>
<li><strong>Professor's Argument:</strong> Myra collapsed due to drought, evidenced by abandonment of agricultural settlements.</li>
<li><strong>Graduate Student's Response:</strong> Tree-ring data shows higher-than-average rainfall (contradicting drought). Settlements were likely abandoned due to coastal raiders (alternate cause).</li>
</ul>
<p>The student's primary move is presenting physical evidence that contradicts the drought premise supporting the professor's conclusion.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Correct. Tree-ring data showing higher-than-average rainfall directly contradicts the drought evidence the professor relied on.</p>
<p><strong>B)</strong> Incorrect. The student does not identify an internal logical inconsistency; they challenge the environmental evidence.</p>
<p><strong>C)</strong> Incorrect. The student does not question dating methods; they offer contradictory environmental data and an alternate cause.</p>
<p><strong>D)</strong> Incorrect. The student does not analyze conditional logic; they present contradictory evidence and an alternate cause.</p>
<p><strong>E)</strong> Incorrect. The student rejects the professor's environmental data rather than accepting it while offering an alternate cause.</p>`,
  },
  {
    sourceItemId: "section-diag-q24",
    questionNumber: 24,
    targetTimeSeconds: 80,
    difficulty: 3,
    questionType: "Weaken",
    stimulusText: `Retail Executive: Last year, our grocery chain eliminated all thin, single-use plastic bags at checkout. Customers must now either bring their own bags or purchase our new, heavy-duty reusable plastic bags for two dollars each. Since implementing this policy, the total number of plastic bags we dispense per month has plummeted by eighty percent. Therefore, our new policy has been a massive victory for environmental conservation.`,
    stemText:
      "Which one of the following, if true, most seriously weakens the retail executive's claim?",
    choices: [
      {
        letter: "A",
        text: "Most customers who purchase the heavy-duty reusable bags use them for other household chores rather than for their future grocery shopping trips.",
        explanation:
          "Reuse for other chores does not directly undermine the environmental benefit of dispensing fewer bags at checkout.",
      },
      {
        letter: "B",
        text: "A competing grocery chain implemented a similar ban on single-use bags and saw a ninety percent reduction in the total number of bags dispensed.",
        explanation:
          "A competitor's results do not weaken the claim that this policy was an environmental victory.",
      },
      {
        letter: "C",
        text: "Producing a single heavy-duty reusable plastic bag requires fifty times the amount of raw plastic and energy as producing a thin, single-use plastic bag.",
        explanation:
          "If reusable bags require vastly more resources to produce, the policy may increase total environmental impact despite fewer bags dispensed.",
      },
      {
        letter: "D",
        text: "Many customers occasionally forget to bring their reusable bags from home and are forced to carry their groceries to their cars by hand.",
        explanation:
          "Customer inconvenience does not weaken the environmental conservation claim.",
      },
      {
        letter: "E",
        text: "The grocery chain's profit margins have increased significantly since they began selling the two-dollar reusable bags at checkout.",
        explanation:
          "Increased profit margins are irrelevant to whether the policy benefited environmental conservation.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a Weaken question challenging an environmental impact claim.</p>
<ul>
<li><strong>Premise:</strong> The chain eliminated single-use bags and sells heavy-duty reusable bags.</li>
<li><strong>Premise:</strong> Total plastic bags dispensed per month dropped 80%.</li>
<li><strong>Conclusion:</strong> The policy was a massive victory for environmental conservation.</li>
</ul>
<p>The executive equates fewer bags dispensed with environmental benefit. We need evidence that the remaining bags cause greater environmental harm per unit.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. Reuse for other chores does not directly undermine the environmental benefit of dispensing fewer bags at checkout.</p>
<p><strong>B)</strong> Incorrect. A competitor's results do not weaken the claim that this policy was an environmental victory.</p>
<p><strong>C)</strong> Correct. If reusable bags require vastly more resources to produce, the policy may increase total environmental impact despite fewer bags dispensed.</p>
<p><strong>D)</strong> Incorrect. Customer inconvenience does not weaken the environmental conservation claim.</p>
<p><strong>E)</strong> Incorrect. Increased profit margins are irrelevant to whether the policy benefited environmental conservation.</p>`,
  },
  {
    sourceItemId: "section-diag-q25",
    questionNumber: 25,
    targetTimeSeconds: 80,
    difficulty: 4,
    questionType: "Flaw",
    stimulusText: `Psychologist: Large-scale surveys consistently show that adults who frequently engage in strenuous cardiovascular exercise are significantly less likely to report experiencing symptoms of chronic anxiety than those who live sedentary lifestyles. Therefore, psychiatrists ought to prescribe rigorous cardiovascular exercise regimens as a primary treatment to cure patients who are currently suffering from severe chronic anxiety.`,
    stemText: "The psychologist's reasoning is flawed because it",
    choices: [
      {
        letter: "A",
        text: "presumes, without providing justification, that physical health is fundamentally more important than mental well-being.",
        explanation:
          "The psychologist never compares the importance of physical health to mental well-being.",
      },
      {
        letter: "B",
        text: "treats a correlation between a lifestyle habit and a lower incidence of a condition as definitive proof that adopting the habit can cure the condition.",
        explanation:
          "Correlation between exercise and lower anxiety does not prove exercise can cure existing severe chronic anxiety.",
      },
      {
        letter: "C",
        text: "attacks the effectiveness of current pharmaceutical treatments for severe chronic anxiety without offering a viable medical alternative.",
        explanation:
          "The psychologist does not attack pharmaceutical treatments; they recommend exercise as a primary treatment.",
      },
      {
        letter: "D",
        text: "takes for granted that patients suffering from severe chronic anxiety have the financial means to access strenuous cardiovascular exercise equipment.",
        explanation:
          "Financial access is a practical concern, not the logical flaw in inferring causation from correlation.",
      },
      {
        letter: "E",
        text: "assumes that adults who do not engage in strenuous cardiovascular exercise will inevitably develop symptoms of chronic anxiety.",
        explanation:
          "The psychologist claims exercise correlates with lower anxiety, not that sedentary adults inevitably develop it.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a flaw question about correlation versus causation.</p>
<ul>
<li><strong>Premise:</strong> Adults who frequently exercise are less likely to report chronic anxiety symptoms than sedentary adults.</li>
<li><strong>Conclusion:</strong> Psychiatrists ought to prescribe rigorous cardiovascular exercise to cure patients currently suffering from severe chronic anxiety.</li>
</ul>
<p>The Flaw: The psychologist observes a correlation between exercise and lower anxiety incidence, then concludes exercise can cure existing severe anxiety. Correlation does not establish that adopting the habit will cure the condition.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The psychologist never compares the importance of physical health to mental well-being.</p>
<p><strong>B)</strong> Correct. Correlation between exercise and lower anxiety does not prove exercise can cure existing severe chronic anxiety.</p>
<p><strong>C)</strong> Incorrect. The psychologist does not attack pharmaceutical treatments; they recommend exercise as a primary treatment.</p>
<p><strong>D)</strong> Incorrect. Financial access is a practical concern, not the logical flaw in inferring causation from correlation.</p>
<p><strong>E)</strong> Incorrect. The psychologist claims exercise correlates with lower anxiety, not that sedentary adults inevitably develop it.</p>`,
  },
]
