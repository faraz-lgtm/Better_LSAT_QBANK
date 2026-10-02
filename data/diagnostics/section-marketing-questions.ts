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
          "This is a supporting premise (the problem). It is a fact used to justify the conclusion, not the conclusion itself.",
      },
      {
        letter: "B",
        text: "The bakery needs to return to using its previous flour supplier.",
        explanation:
          'This is a flawless, direct paraphrase of the author\'s main claim: "the bakery must immediately revert to its original flour supplier."',
      },
      {
        letter: "C",
        text: "Retaining a loyal customer base is more financially valuable than reducing ingredient costs.",
        explanation:
          "This is Premise 2. It is the guiding financial principle the author uses to prove why the bakery should switch back to the old flour.",
      },
      {
        letter: "D",
        text: "The artisan bakery switched to a cheaper flour solely to cut operational costs.",
        explanation:
          "This is merely the opening contextual information used to set the stage for the argument.",
      },
      {
        letter: "E",
        text: "Reverting to the original flour supplier is the only way to satisfy the bakery's loyal customers.",
        explanation:
          'This choice uses extreme, absolute language ("the only way") that the author never used. The author recommends reverting to the original supplier, but they never logically claim it is the absolute only method to achieve customer satisfaction.',
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Main Conclusion. Your singular goal here is to disentangle the author's ultimate point from the evidence they use to support that point. Let's break down the mechanics of the paragraph:</p>
<ul>
<li><strong>Context:</strong> The bakery switched to cheaper flour to cut costs.</li>
<li><strong>Premise 1 (The Problem):</strong> Customer complaints about texture have skyrocketed since the switch.</li>
<li><strong>The Conclusion:</strong> "So the bakery must immediately revert to its original flour supplier."</li>
<li><strong>Premise 2 (The Justification):</strong> Losing loyal customers costs more in the long run than saving money on cheaper ingredients.</li>
</ul>
<p>The structural indicator word "So" is your massive neon sign here. The entire paragraph is built to justify that specific prescriptive recommendation. Every other sentence serves either to introduce the problem or to explain the financial logic behind the proposed solution.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. This is a supporting premise (the problem). It is a fact used to justify the conclusion, not the conclusion itself.</p>
<p><strong>B)</strong> Correct. This is a flawless, direct paraphrase of the author's main claim: "the bakery must immediately revert to its original flour supplier."</p>
<p><strong>C)</strong> Incorrect. This is Premise 2. It is the guiding financial principle the author uses to prove why the bakery should switch back to the old flour.</p>
<p><strong>D)</strong> Incorrect. This is merely the opening contextual information used to set the stage for the argument.</p>
<p><strong>E)</strong> Incorrect. This choice uses extreme, absolute language ("the only way") that the author never used. The author recommends reverting to the original supplier, but they never logically claim it is the absolute only method to achieve customer satisfaction.</p>`,
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
          "We only know that it grows in the eastern rainforest and needs high humidity to bloom. The stimulus does not give us enough information to definitively claim it cannot \"survive\" anywhere else (for instance, maybe it can survive in a dormant state in a lab).",
      },
      {
        letter: "B",
        text: "The botanist's photograph was taken in the eastern rainforest rather than a greenhouse.",
        explanation:
          "We have no reason to doubt where the botanist took the photo. The greenhouse exists; the issue is with the botanist's identification of the flower inside it.",
      },
      {
        letter: "C",
        text: "The flower that the botanist photographed in the botanical greenhouse was likely not a blooming Blue Ghost Orchid.",
        explanation:
          "This matches our synthesis perfectly. Since the greenhouse capped out at 60% humidity, the biological requirement for a bloom (>80%) was not met. The botanist is almost certainly misidentifying the flower.",
      },
      {
        letter: "D",
        text: "The greenhouse failed to properly maintain its strict maximum humidity of 60 percent.",
        explanation:
          "This is a massive leap. We have no evidence that the sophisticated greenhouse machinery failed; it is much more likely that one amateur botanist simply misidentified a plant.",
      },
      {
        letter: "E",
        text: "The botanist intentionally falsified the photograph to gain recognition in the scientific community.",
        explanation:
          "We know the botanist's claim is scientifically flawed, but we have absolutely no evidence to support a malicious motive or \"intentional falsification.\" They could simply be mistaken.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Most Strongly Supported (Inference). In this question type, you are given a set of facts and must act as a detective synthesizing them. You cannot bring in outside information; you must strictly combine the rules provided to find the logical deduction. Let's map the facts:</p>
<ul>
<li><strong>Fact 1 (The Blooming Rule):</strong> The orchid blooms →Humidity is &gt;80% for 3+ days. (Note: The &gt;80% humidity is a necessary condition for a bloom to happen).</li>
<li><strong>Fact 2 (The Growing Rule):</strong> The orchid grows → Heavily shaded underbrush of eastern rainforest.</li>
<li><strong>Fact 3 (The Botanist's Claim):</strong> The botanist photographed a fully blooming Blue Ghost Orchid in a greenhouse with a strict maximum of 60% humidity.</li>
</ul>
<p>Now, synthesize. If the greenhouse physically cannot exceed 60% humidity, then it is mathematically impossible for the &gt;80% necessary condition to be met. If the necessary condition is destroyed, the sufficient condition (the bloom) cannot occur. Therefore, whatever the botanist took a picture of, it couldn't have been a blooming Blue Ghost Orchid.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. We only know that it grows in the eastern rainforest and needs high humidity to bloom. The stimulus does not give us enough information to definitively claim it cannot "survive" anywhere else (for instance, maybe it can survive in a dormant state in a lab).</p>
<p><strong>B)</strong> Incorrect. We have no reason to doubt where the botanist took the photo. The greenhouse exists; the issue is with the botanist's identification of the flower inside it.</p>
<p><strong>C)</strong> Correct. This matches our synthesis perfectly. Since the greenhouse capped out at 60% humidity, the biological requirement for a bloom (&gt;80%) was not met. The botanist is almost certainly misidentifying the flower.</p>
<p><strong>D)</strong> Incorrect. This is a massive leap. We have no evidence that the sophisticated greenhouse machinery failed; it is much more likely that one amateur botanist simply misidentified a plant.</p>
<p><strong>E)</strong> Incorrect. We know the botanist's claim is scientifically flawed, but we have absolutely no evidence to support a malicious motive or "intentional falsification." They could simply be mistaken.</p>`,
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
          "This is a textbook causal strengthener. It shows that when the hypothesized cause (the complex tutorial) is removed from the equation, the negative effect (uninstalling) drops significantly. This strongly proves the developer's theory that the tutorial was the root of the problem.",
      },
      {
        letter: "B",
        text: "The productivity software requires users to learn several unique organizational frameworks to utilize its best features.",
        explanation:
          "This actually weakens the argument. If the software is inherently super complicated, replacing the tutorial with a \"simple\" one might leave users completely confused and still result in high uninstall rates.",
      },
      {
        letter: "C",
        text: "Most competing productivity applications also feature complex initial tutorials.",
        explanation:
          "What competitors do is entirely out of scope. It tells us nothing about why this specific app's users are uninstalling it.",
      },
      {
        letter: "D",
        text: "The developer previously replaced a complex tutorial in a different app without seeing a change in user retention.",
        explanation:
          "This is a weakener. If her exact same plan completely failed in the past, it casts doubt on whether it will succeed this time.",
      },
      {
        letter: "E",
        text: "A simple, interactive setup guide is generally less expensive for a software developer to design and implement.",
        explanation:
          "The goal of the plan is to \"significantly reduce the uninstall rate.\" The financial cost of developing the guide is completely irrelevant to whether or not the guide will actually stop users from deleting the app.",
      },
    ],
    correctAnswer: "A",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Strengthen. The author presents a causal argument and a proposed solution. Let's break down the cause-and-effect relationship:</p>
<ul>
<li><strong>The Phenomenon:</strong> Users are uninstalling the app in the first week.</li>
<li><strong>The Hypothesized Cause:</strong> The highly complex initial tutorial is frustrating them.</li>
<li><strong>The Proposed Solution:</strong> Replace the complex tutorial with a simple one to fix the uninstall rate.</li>
</ul>
<p>To strengthen a causal claim, we need an answer that bolsters the link between the tutorial (the cause) and the uninstalls (the effect). One of the most powerful ways to strengthen a causal relationship on the LSAT is to show that when the cause is absent, the effect is also absent. This would give credence that the proposed cause is in fact the real cause.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Correct. This is a textbook causal strengthener. It shows that when the hypothesized cause (the complex tutorial) is removed from the equation, the negative effect (uninstalling) drops significantly. This strongly proves the developer's theory that the tutorial was the root of the problem.</p>
<p><strong>B)</strong> Incorrect. This actually weakens the argument. If the software is inherently super complicated, replacing the tutorial with a "simple" one might leave users completely confused and still result in high uninstall rates.</p>
<p><strong>C)</strong> Incorrect. What competitors do is entirely out of scope. It tells us nothing about why this specific app's users are uninstalling it.</p>
<p><strong>D)</strong> Incorrect. This is a weakener. If her exact same plan completely failed in the past, it casts doubt on whether it will succeed this time.</p>
<p><strong>E)</strong> Incorrect. The goal of the plan is to "significantly reduce the uninstall rate." The financial cost of developing the guide is completely irrelevant to whether or not the guide will actually stop users from deleting the app.</p>`,
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
          "The mayor never actually weighs the value of the historic district against economic growth. The mayor just attacks the Chamber's claim that growth will be stifled in the first place.",
      },
      {
        letter: "B",
        text: "rejects an argument solely on the basis of the presumed motives of the group advancing that argument.",
        explanation:
          "This is the exact definition of a Source/Ad Hominem flaw. The mayor dismisses the argument strictly because he presumes the Chamber is motivated by corporate greed, completely failing to address the actual economic points they raised.",
      },
      {
        letter: "C",
        text: "treats a condition that is necessary for economic growth as a condition that is sufficient to guarantee it.",
        explanation:
          "This describes a Necessary vs. Sufficient conditional logic flaw. There is no conditional (\"if/then\") reasoning present in this stimulus at all.",
      },
      {
        letter: "D",
        text: "attacks a specific proposal rather than addressing the broader economic policies of the city.",
        explanation:
          "The mayor isn't attacking a proposal; the mayor is defending his own proposal by attacking the people criticizing it.",
      },
      {
        letter: "E",
        text: "takes for granted that commercial development inevitably damages historic districts.",
        explanation:
          "The stimulus states that the proposal restricts commercial development near the district, but the mayor's flawed reasoning isn't based on an assumption about inevitable damage; it's based entirely on attacking the Chamber's corporate profits.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Flaw. You must identify the exact structural error in the author's logic.</p>
<ul>
<li><strong>The Opponent's Claim:</strong> The Chamber of Commerce argues the zoning proposal will stifle economic growth.</li>
<li><strong>The Mayor's Rebuttal:</strong> The Chamber of Commerce is just a bunch of greedy business owners who only care about maximizing their own profits.</li>
<li><strong>The Mayor's Conclusion:</strong> Therefore, their argument against the zoning proposal is completely unfounded.</li>
</ul>
<p>This is one of the most common and recognizable logical fallacies on the LSAT: the Source Attack (or Ad Hominem flaw). The mayor completely ignores the actual substance of the Chamber's economic argument and instead attacks their personal motives and character. You can never invalidate an argument simply by pointing out that the speaker has a biased or selfish motive.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The mayor never actually weighs the value of the historic district against economic growth. The mayor just attacks the Chamber's claim that growth will be stifled in the first place.</p>
<p><strong>B)</strong> Correct. This is the exact definition of a Source/Ad Hominem flaw. The mayor dismisses the argument strictly because he presumes the Chamber is motivated by corporate greed, completely failing to address the actual economic points they raised.</p>
<p><strong>C)</strong> Incorrect. This describes a Necessary vs. Sufficient conditional logic flaw. There is no conditional ("if/then") reasoning present in this stimulus at all.</p>
<p><strong>D)</strong> Incorrect. The mayor isn't attacking a proposal; the mayor is defending his own proposal by attacking the people criticizing it.</p>
<p><strong>E)</strong> Incorrect. The stimulus states that the proposal restricts commercial development near the district, but the mayor's flawed reasoning isn't based on an assumption about inevitable damage; it's based entirely on attacking the Chamber's corporate profits.</p>`,
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
          "Pointing out that some considered the journey as \"difficult\" does not mean it could not have happened. This only introduces a potential logistical hurdle some had believed in; it does not weaken the conclusion that the merchants made the trip. And remember, some can mean as low as one person thought it was a difficult journey. This does not weaken whether or not the journey took place, it is only a belief of some people.",
      },
      {
        letter: "B",
        text: "The clay pots discovered in Region X were crafted from a type of local river mud that is completely unavailable anywhere near Region Y.",
        explanation:
          "This is a weakener. If the pots found in Region X were made from mud that only exists in Region X, it is highly unlikely those pots would have been manufactured in Region Y and transported over. The design may have traveled, but the physical pots definitely did not.",
      },
      {
        letter: "C",
        text: "Some ancient records indicate that merchants from Region X occasionally traveled to Region Y to trade spices.",
        explanation:
          "This strengthens the stimulus by allowing for the physical transportation of the pots. If they were moving back and forth occasionally for spices, they could have brought the pots as well.",
      },
      {
        letter: "D",
        text: "The geometric designs found on the pots in Region Y are much more intricate than designs found in other neighboring regions.",
        explanation:
          "The intricacy of the designs compared to other regions is entirely irrelevant to how the designs ended up in Region X.",
      },
      {
        letter: "E",
        text: "Ancient clay pots are highly fragile and easily broken during long-distance merchant travel.",
        explanation:
          "Similar to A, this just means the trip was risky. Just because pots are easily broken does not mean that some pots couldn't have survived the journey.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Weaken. This stimulus relies on a classic causal/historical deduction. Let’s map the archaeologist's logic:</p>
<ul>
<li><strong>Premise:</strong> Pots in Region X perfectly match the unique, older geometric designs of pots from Region Y.</li>
<li><strong>Conclusion:</strong> Therefore, traveling merchants from Region Y must have physically transported these specific pots to Region X.</li>
</ul>
<p>The author observes a similarity between two things and assumes that the physical objects themselves were moved. The logical gap here is enormous. What if the idea of the design traveled, rather than the pots? What if an artist from Region Y moved to Region X and started making pots there? To weaken this argument, we need an answer choice that severs the link between the design similarity and the physical transportation of the pots.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. Pointing out that some considered the journey as "difficult" does not mean it could not have happened. This only introduces a potential logistical hurdle some had believed in; it does not weaken the conclusion that the merchants made the trip. And remember, some can mean as low as one person thought it was a difficult journey. This does not weaken whether or not the journey took place, it is only a belief of some people.</p>
<p><strong>B)</strong> Correct. This is a weakener. If the pots found in Region X were made from mud that only exists in Region X, it is highly unlikely those pots would have been manufactured in Region Y and transported over. The design may have traveled, but the physical pots definitely did not.</p>
<p><strong>C)</strong> Incorrect. This strengthens the stimulus by allowing for the physical transportation of the pots. If they were moving back and forth occasionally for spices, they could have brought the pots as well.</p>
<p><strong>D)</strong> Incorrect. The intricacy of the designs compared to other regions is entirely irrelevant to how the designs ended up in Region X.</p>
<p><strong>E)</strong> Incorrect. Similar to A, this just means the trip was risky. Just because pots are easily broken does not mean that some pots couldn't have survived the journey.</p>`,
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
          "The main conclusion is the final recommendation (claim 4): the city council ought to vote against the proposal, which the claim in question supports. Remember, a main conclusion cannot be support anything else.",
      },
      {
        letter: "B",
        text: "It is a premise offered to demonstrate that delivery companies will pass the tax cost onto consumers.",
        explanation:
          "The structural relationship is backward here. The claim about corporate behavior is a premise offered to support claim 2, not the other way around.",
      },
      {
        letter: "C",
        text: "It is an intermediate conclusion that is supported by a claim about corporate behavior and that serves to support the argument's final recommendation.",
        explanation:
          "This perfectly maps the anatomy of the stimulus. It is supported by the premise about corporate behavior (passing the cost on), and it is used to support the final recommendation (voting against the tax), making it an intermediate conclusion",
      },
      {
        letter: "D",
        text: "It is a principle that dictates why the city council should prioritize economic stability over environmental goals.",
        explanation:
          "It is not a broad principle; the claim we are asked about is a specific factual prediction about a single tax. Furthermore, the author never suggests prioritizing economic stability over the environment; they just argue this specific tax won't help the environment.",
      },
      {
        letter: "E",
        text: "It is a phenomenon that the author attempts to explain by outlining the behavior of local consumers.",
        explanation:
          "This claim in question is not a phenomenon that the author attempts to explain. It is just an intermediate conclusion that is established to help support why the city council ought to vote against the mayor's proposal. Not to mention, the author explains the failure by outlining the behavior of delivery companies (corporations), not local consumers.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Role. Your task is to analyze the argument structurally, not so much for content, and map the support structure of each claim. In this question, we are asked to identify the function of the phrase: "this proposed tax will completely fail to achieve its environmental goal."</p>
<ul>
<li><strong>Claim 1 (Context):</strong> The mayor proposed a steep tax on large delivery vehicles to reduce carbon emissions.</li>
<li><strong>Claim 2 (The Sub-conclusion):</strong> The proposed tax will completely fail to achieve its environmental goal.</li>
<li><strong>Claim 3 (The Minor Premise):</strong> Delivery companies will just pass the cost to consumers instead of buying eco-friendly vehicles. (Note: This sentence directly explains why the tax will fail).</li>
<li><strong>Claim 4 (The Main Conclusion):</strong> "Therefore, the city council ought to vote against the mayor's proposal." (Note: Claim 2 explains why the council should vote against it).</li>
</ul>
<p>Because Claim 2 is supported by the minor premise (Claim 3), it acts as a conclusion. However, that same claim then goes on to support the ultimate recommendation (Claim 4), meaning it is not the main conclusion. It is a stepping stone—an intermediate or sub-conclusion.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The main conclusion is the final recommendation (claim 4): the city council ought to vote against the proposal, which the claim in question supports. Remember, a main conclusion cannot be support anything else.</p>
<p><strong>B)</strong> Incorrect. The structural relationship is backward here. The claim about corporate behavior is a premise offered to support claim 2, not the other way around.</p>
<p><strong>C)</strong> Correct. This perfectly maps the anatomy of the stimulus. It is supported by the premise about corporate behavior (passing the cost on), and it is used to support the final recommendation (voting against the tax), making it an intermediate conclusion</p>
<p><strong>D)</strong> Incorrect. It is not a broad principle; the claim we are asked about is a specific factual prediction about a single tax. Furthermore, the author never suggests prioritizing economic stability over the environment; they just argue this specific tax won't help the environment.</p>
<p><strong>E)</strong> Incorrect. This claim in question is not a phenomenon that the author attempts to explain. It is just an intermediate conclusion that is established to help support why the city council ought to vote against the mayor's proposal. Not to mention, the author explains the failure by outlining the behavior of delivery companies (corporations), not local consumers.</p>`,
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
          "The argument doesn’t need to assume this. Morale was simply the original motivation for the schedule shift, which was mentioned in the context. The conclusion of the argument is strictly about weekly output not going down, not about whether the morale shift is successful. If we negate this choice and say the transition won’t successfully boost employee morale (to see if it destroys the argument), they could still be more focused and efficient on their shifts, offsetting any losses from not working as much, keeping weekly output the same.",
      },
      {
        letter: "B",
        text: "Employees currently waste a significant portion of their five-day workweek on non-essential tasks.",
        explanation:
          "Let's use the Negation Test. What if employees don't waste time on non-essential tasks? Could the argument still survive? Yes. Even if they are perfectly busy now, maybe they will just type twice as fast on the four-day schedule. This is not strictly necessary for the argument to work.",
      },
      {
        letter: "C",
        text: "The increase in employee focus and efficiency will be sufficient to fully offset the reduction in total hours worked.",
        explanation:
          "Use the Negation Test: IF the increase in efficiency will NOT be sufficient to fully offset the reduction in hours. If this is true, the total output must drop. Because negating this answer choice utterly destroys the author's conclusion, it is the correct necessary assumption that the author must assume for this argument to be possible.",
      },
      {
        letter: "D",
        text: "Companies that maintain a five-day workweek generally suffer from lower employee morale.",
        explanation:
          "Comparisons to the general state of other companies are completely out of scope for this specific firm's output mathematics. The author does not have to assume anything about what generally happens in other companies for his argument to work.",
      },
      {
        letter: "E",
        text: "The company's total weekly output is the only metric the human resources director cares about.",
        explanation:
          "\"The only metric\" is incredibly extreme. The director might care deeply about turnover, healthcare costs, or morale. They don't need output to be the only thing they care about to make an argument about it. Not necessary.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Necessary Assumption. We must find an assumption that the argument is required to assume in order to work. If this assumption is false, the argument should collapse. This argument boils down to a simple mathematical equation.</p>
<ul>
<li><strong>Context:</strong> The corporate office is transitioning from a traditional five-day schedule to a four-day workweek in an effort to boost employee morale.</li>
<li><strong>Premise 1:</strong> The total hours worked by employees will go down.</li>
<li><strong>Premise 2:</strong> The focus and efficiency of the employees will go up.</li>
<li><strong>Conclusion:</strong> Total weekly output will not negatively change.</li>
</ul>
<p>The gap here is one of scale. The author is assuming that the increase in efficiency is large enough to balance out the loss of physical time present on the job. If employees lose 20% of their hours, but only get 1% more efficient, total output would crash. The argument is entirely reliant on the assumption that the boost in efficiency offsets the loss of time.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The argument doesn’t need to assume this. Morale was simply the original motivation for the schedule shift, which was mentioned in the context. The conclusion of the argument is strictly about weekly output not going down, not about whether the morale shift is successful. If we negate this choice and say the transition won’t successfully boost employee morale (to see if it destroys the argument), they could still be more focused and efficient on their shifts, offsetting any losses from not working as much, keeping weekly output the same.</p>
<p><strong>B)</strong> Incorrect. Let's use the Negation Test. What if employees don't waste time on non-essential tasks? Could the argument still survive? Yes. Even if they are perfectly busy now, maybe they will just type twice as fast on the four-day schedule. This is not strictly necessary for the argument to work.</p>
<p><strong>C)</strong> Correct. Use the Negation Test: IF the increase in efficiency will NOT be sufficient to fully offset the reduction in hours. If this is true, the total output must drop. Because negating this answer choice utterly destroys the author's conclusion, it is the correct necessary assumption that the author must assume for this argument to be possible.</p>
<p><strong>D)</strong> Incorrect. Comparisons to the general state of other companies are completely out of scope for this specific firm's output mathematics. The author does not have to assume anything about what generally happens in other companies for his argument to work.</p>
<p><strong>E)</strong> Incorrect. "The only metric" is incredibly extreme. The director might care deeply about turnover, healthcare costs, or morale. They don't need output to be the only thing they care about to make an argument about it. Not necessary.</p>`,
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
          "The consultant never mentions the cost of the marketing campaign or the financial health of the manager's company.",
      },
      {
        letter: "B",
        text: "Pointing out an alternate cause for the outcome the manager attributes to the digital marketing campaign.",
        explanation:
          "This is a flawless description of the consultant's tactic. The outcome is \"doubled sales,\" and the consultant introduces \"drastically lowered retail prices\" as the alternate cause for the outcome instead.",
      },
      {
        letter: "C",
        text: "Questioning the accuracy of the sales data provided regarding the competitor's quarterly performance.",
        explanation:
          "The consultant does not dispute the data. The consultant fully agrees that the competitor's sales doubled; they only disagree on why they doubled.",
      },
      {
        letter: "D",
        text: "Arguing that print advertising is generally more effective than digital marketing in their specific industry.",
        explanation:
          "The consultant makes no claims about the general effectiveness of print versus digital media.",
      },
      {
        letter: "E",
        text: "Identifying a contradiction between the manager's stated goals and the manager's proposed actions.",
        explanation:
          "There is no contradiction. The manager's goal is to double sales, and their action (copying the competitor) logically aligns with that goal, assuming the manager's causal premise is true. The consultant attacks the premise, not the alignment of the goals.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Method of Reasoning. We must identify exactly how the Consultant attacks the Manager's argument.</p>
<ul>
<li><strong>The Manager's Argument:</strong> Competitor did X (digital marketing) → Outcome Y occurred (sales doubled). Therefore, we should do X to get Y.</li>
<li><strong>The Consultant's Rebuttal:</strong> The competitor did Z (lowered retail prices) at the exact same time they did X.</li>
</ul>
<p>The Manager is assuming a strict causal relationship between digital marketing and the sales boost. The Consultant responds by pointing out a massive alternate cause: slashing prices. If the competitor slashed their prices, that is another potential reason their sales doubled, rendering the manager's plan to just copy the digital marketing potentially ineffective.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The consultant never mentions the cost of the marketing campaign or the financial health of the manager's company.</p>
<p><strong>B)</strong> Correct. This is a flawless description of the consultant's tactic. The outcome is "doubled sales," and the consultant introduces "drastically lowered retail prices" as the alternate cause for the outcome instead.</p>
<p><strong>C)</strong> Incorrect. The consultant does not dispute the data. The consultant fully agrees that the competitor's sales doubled; they only disagree on why they doubled.</p>
<p><strong>D)</strong> Incorrect. The consultant makes no claims about the general effectiveness of print versus digital media.</p>
<p><strong>E)</strong> Incorrect. There is no contradiction. The manager's goal is to double sales, and their action (copying the competitor) logically aligns with that goal, assuming the manager's causal premise is true. The consultant attacks the premise, not the alignment of the goals.</p>`,
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
          "Even if the stars emit more high-frequency radiation, this does not explain why a telescope equipped exclusively for low-frequency waves is picking up the high-frequency waves, nor does it explain why the low-frequency waves are completely absent (it should still pick up some).",
      },
      {
        letter: "B",
        text: "The satellite's shielding material unexpectedly converts ambient high-frequency cosmic radiation into a concentrated internal signal that overwhelms the low-frequency sensors.",
        explanation:
          "This is a brilliant resolution that hits both sides of the paradox. Where is the high-frequency data coming from? The satellite's own shielding is inadvertently creating it from ambient cosmic radiation. Why is there zero low-frequency data? Because this internal high-frequency signal is completely overwhelming the low-frequency sensors, rendering them blind. The mystery is solved.",
      },
      {
        letter: "C",
        text: "Earth's atmosphere naturally blocks most low-frequency radio waves from reaching surface-level observatories, which is why the satellite was launched into space.",
        explanation:
          "This explains the motivation for launching the satellite into space, but it does absolutely nothing to explain the bizarre data feed the satellite is currently sending back.",
      },
      {
        letter: "D",
        text: "The scientific team previously utilized a different telescope that was capable of detecting both high and low-frequency waves simultaneously.",
        explanation:
          "The history of the scientific team’s equipment is entirely out of scope. We only care about the mechanical failure occurring on this specific new satellite, not what happened with a previous telescope that was designed to detect both high and low frequency waves simultaneously.",
      },
      {
        letter: "E",
        text: "Low-frequency radio waves degrade over vast cosmic distances much faster than high-frequency waves do.",
        explanation:
          "This is a half-measure trap. It might partially explain why the low-frequency waves are absent (they degraded, even though they still could be present despite this), but it utterly fails to explain the second half of the paradox: why a telescope optimized exclusively for low-frequency waves is suddenly flooded with high-frequency signals.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Resolve the Paradox. On the LSAT, a paradox is simply a situation where two facts seem to contradict each other, creating a mystery. Your job is to find a piece of evidence that makes both facts perfectly logical simultaneously. Let’s map the mystery:</p>
<ul>
<li><strong>Fact 1 (The Expectation):</strong> A new satellite telescope was optimized exclusively to detect faint, low-frequency radio waves. The team expected a massive influx of this specific data.</li>
<li><strong>Fact 2 (The Reality):</strong> The telescope is capturing almost zero low-frequency waves, and its data feed is instead flooded with high-intensity, high-frequency signals.</li>
</ul>
<p>The mystery has two distinct parts that must be solved together: Why are there no low-frequency waves being recorded by a machine designed exclusively to find them, AND where are all these high-frequency signals coming from?</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. Even if the stars emit more high-frequency radiation, this does not explain why a telescope equipped exclusively for low-frequency waves is picking up the high-frequency waves, nor does it explain why the low-frequency waves are completely absent (it should still pick up some).</p>
<p><strong>B)</strong> Correct. This is a brilliant resolution that hits both sides of the paradox. Where is the high-frequency data coming from? The satellite's own shielding is inadvertently creating it from ambient cosmic radiation. Why is there zero low-frequency data? Because this internal high-frequency signal is completely overwhelming the low-frequency sensors, rendering them blind. The mystery is solved.</p>
<p><strong>C)</strong> Incorrect. This explains the motivation for launching the satellite into space, but it does absolutely nothing to explain the bizarre data feed the satellite is currently sending back.</p>
<p><strong>D)</strong> Incorrect. The history of the scientific team’s equipment is entirely out of scope. We only care about the mechanical failure occurring on this specific new satellite, not what happened with a previous telescope that was designed to detect both high and low frequency waves simultaneously.</p>
<p><strong>E)</strong> Incorrect. This is a half-measure trap. It might partially explain why the low-frequency waves are absent (they degraded, even though they still could be present despite this), but it utterly fails to explain the second half of the paradox: why a telescope optimized exclusively for low-frequency waves is suddenly flooded with high-frequency signals.</p>`,
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
          "This is a temporary wash that leaves the stone intact. The rule only governs permanent alterations. This is perfectly permissible and it only removes decades of grime that happened after the original stone was composed.",
      },
      {
        letter: "B",
        text: "A restorer permanently re-weaves the backing of a medieval tapestry because an aggressive mold was actively dissolving the original threads.",
        explanation:
          "The restorer makes a permanent alteration, which triggers the rule. However, they do so to stop mold from \"actively dissolving\" the piece. This satisfies the exception for preventing physical destruction, so no rule is broken.",
      },
      {
        letter: "C",
        text: "A restorer paints over a faded section of a 16th-century canvas using permanent modern acrylics because the original artist's intended colors were no longer visible to museum patrons, although the canvas itself was structurally stable.",
        explanation:
          "This is a glaring violation. The restorer makes a permanent alteration (using permanent modern acrylics). Was it to prevent physical destruction? No. The stimulus explicitly states the canvas was \"structurally stable.\" The alteration was made purely for aesthetic reasons (visibility to patrons). This shatters the principle.",
      },
      {
        letter: "D",
        text: "A restorer refuses to apply a permanent binding agent to a crumbling ancient vase because a newly developed, non-permanent resin can safely stabilize the clay.",
        explanation:
          "The restorer actively follows the principle here. They refuse to use a permanent alteration because an alternative (non-permanent) method exists to save the piece.",
      },
      {
        letter: "E",
        text: "A restorer places a fragile watercolor painting inside a permanent, vacuum-sealed glass case to stop the paper from disintegrating upon contact with the open air.",
        explanation:
          "Enclosing a painting in a glass case is not an alteration of the painting's \"original composition.\" Besides, even if it were considered an alteration, it is being done to stop the paper from disintegrating, which satisfies the exception.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Principle Application. This question provides a strict, rigid rule and asks you to find the scenario that breaks it. To master this, you must translate the principle into a strict logical checklist.</p>
<ul>
<li><strong>The Principle:</strong> An art restorer ought never to permanently alter the original composition of a masterwork unless doing so is the only possible way to prevent the physical destruction of the piece.</li>
</ul>
<p>The Trigger (What invokes the rule?): A permanent alteration of the original composition. (If the alteration is temporary, the rule doesn't care. It also doesn’t matter if you alter something that was not NOT apart of the original composition).</p>
<p>The Exception (When is it allowed?): It is ONLY allowed if it is the absolute last resort to save the piece from physical destruction.</p>
<p>To violate this principle, an answer choice must feature a restorer who makes a permanent alteration for any reason other than preventing imminent physical destruction.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. This is a temporary wash that leaves the stone intact. The rule only governs permanent alterations. This is perfectly permissible and it only removes decades of grime that happened after the original stone was composed.</p>
<p><strong>B)</strong> Incorrect. The restorer makes a permanent alteration, which triggers the rule. However, they do so to stop mold from "actively dissolving" the piece. This satisfies the exception for preventing physical destruction, so no rule is broken.</p>
<p><strong>C)</strong> Correct. This is a glaring violation. The restorer makes a permanent alteration (using permanent modern acrylics). Was it to prevent physical destruction? No. The stimulus explicitly states the canvas was "structurally stable." The alteration was made purely for aesthetic reasons (visibility to patrons). This shatters the principle.</p>
<p><strong>D)</strong> Incorrect. The restorer actively follows the principle here. They refuse to use a permanent alteration because an alternative (non-permanent) method exists to save the piece.</p>
<p><strong>E)</strong> Incorrect. Enclosing a painting in a glass case is not an alteration of the painting's "original composition." Besides, even if it were considered an alteration, it is being done to stop the paper from disintegrating, which satisfies the exception.</p>`,
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
          "Apply the Yes/No test. The Economist explicitly states this, so their answer is \"Yes.\" However, what is the Urban Planner's stance on this general economic theory? We have absolutely no idea. The planner never addresses traffic or commerce; they only address property values and tax fairness. Because we cannot definitively assign a \"No\" to the planner, this choice fails the test.",
      },
      {
        letter: "B",
        text: "the new municipal subway line will increase property values in distant suburbs.",
        explanation:
          "Apply the Yes/No test. The Urban Planner explicitly says \"No\" (stating that it leaves distant suburbs \"completely unaffected\"). However, the Economist never mentions property values at all. The Economist is focused on macroeconomic benefits (overall traffic and commerce). Since we don't know the Economist's specific stance on suburban property values, this fails the test.",
      },
      {
        letter: "C",
        text: "the cost of funding the new subway line should be distributed equally among all property owners in the city.",
        explanation:
          "Apply the Yes/No test. Economist: \"Yes! Every citizen should share the cost equally.\" Urban Planner: \"No! Funding should be raised via a targeted tax.\" This produces a perfect Yes/No split. It represents the exact crux of their debate.",
      },
      {
        letter: "D",
        text: "citizens who live within a mile of the new stations will use the subway more frequently than those in the suburbs.",
        explanation:
          "Neither speaker brings up the frequency of daily ridership. They are debating economic impact and tax burdens, not the daily commuter habits of the citizens. We cannot assign a \"Yes\" or \"No\" to either speaker here.",
      },
      {
        letter: "E",
        text: "targeted property taxes are generally more difficult to implement than blanket property taxes.",
        explanation:
          "The logistical or administrative difficulty of implementing a tax is never mentioned by either party. They are arguing over the hypothetical implementation of the tax, not the bureaucratic red tape required to collect it.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Point at Issue. This question requires you to pinpoint the exact logical intersection where two opposing arguments collide. The foolproof, mechanical method for solving this is the "Yes/No Test." The correct answer must be a statement where one speaker would definitively say "Yes!" and the other speaker would definitively say "No!" If you don't know what one of the speakers would say, or if they would both agree, the answer is wrong. Let’s map the stances:</p>
<ul>
<li><strong>Economist's Stance:</strong> The city should use a blanket property tax for all neighborhoods. Reasoning: A robust transit system benefits the entire local economy, so every citizen should share the cost equally.</li>
<li><strong>Urban Planner's Stance:</strong> A blanket tax is unfair. Reasoning: The benefits are hyper-localized (property values only increase for homes within a mile of the stations), so funding should be raised via a targeted tax on nearby properties only.</li>
</ul>
<p>The core friction here is entirely about the mechanism of funding and how the cost should be distributed based on who benefits.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. Apply the Yes/No test. The Economist explicitly states this, so their answer is "Yes." However, what is the Urban Planner's stance on this general economic theory? We have absolutely no idea. The planner never addresses traffic or commerce; they only address property values and tax fairness. Because we cannot definitively assign a "No" to the planner, this choice fails the test.</p>
<p><strong>B)</strong> Incorrect. Apply the Yes/No test. The Urban Planner explicitly says "No" (stating that it leaves distant suburbs "completely unaffected"). However, the Economist never mentions property values at all. The Economist is focused on macroeconomic benefits (overall traffic and commerce). Since we don't know the Economist's specific stance on suburban property values, this fails the test.</p>
<p><strong>C)</strong> Correct. Apply the Yes/No test. Economist: "Yes! Every citizen should share the cost equally." Urban Planner: "No! Funding should be raised via a targeted tax." This produces a perfect Yes/No split. It represents the exact crux of their debate.</p>
<p><strong>D)</strong> Incorrect. Neither speaker brings up the frequency of daily ridership. They are debating economic impact and tax burdens, not the daily commuter habits of the citizens. We cannot assign a "Yes" or "No" to either speaker here.</p>
<p><strong>E)</strong> Incorrect. The logistical or administrative difficulty of implementing a tax is never mentioned by either party. They are arguing over the hypothetical implementation of the tax, not the bureaucratic red tape required to collect it.</p>`,
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
          "The LSAT relentlessly punishes test-takers who ignore extreme language. The word \"only\" makes this a massive overstep. We know that these specific tube worms rely on bacteria, but the stimulus provides absolutely zero information about the rest of the animal kingdom. There could be thousands of other organisms that do the same thing.",
      },
      {
        letter: "B",
        text: "Without a continuous supply of hydrogen sulfide from the vents, the native tube worms don't survive.",
        explanation:
          "This is a direct deduction based on our factual chain. No hydrogen sulfide → bacteria starve and die → worms lose their sole biological method of getting nourishment → worms die. The worms' survival is mechanically tethered to the presence of hydrogen sulfide.",
      },
      {
        letter: "C",
        text: "The symbiotic bacteria living inside the tube worms can survive in environments other than hydrothermal vents.",
        explanation:
          "This actively contradicts the information from the text, meaning it is anti-supported. The stimulus tells us that without the specific hydrogen sulfide emitted from the vents, the bacteria \"rapidly die off.\" Therefore, they cannot just pack up and survive in a normal ocean environment.",
      },
      {
        letter: "D",
        text: "When a hydrothermal vent becomes dormant, the native tube worms develop a traditional digestive tract.",
        explanation:
          "This is anti-supported. The stimulus explicitly states they \"completely lack\" a digestive tract. There is absolutely zero evidence in the text to suggest they possess the evolutionary magic to instantly grow one when their food source disappears.",
      },
      {
        letter: "E",
        text: "Hydrogen sulfide is toxic to all marine life except for the deep-sea tube worms and their symbiotic bacteria.",
        explanation:
          "This is another extreme language trap. The stimulus says the hydrogen sulfide is \"toxic,\" but jumping to the absolute conclusion that it is toxic to \"all marine life\" except these two specific organisms is a massive assumption that goes far beyond the provided text.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Most Strongly Supported. In this question type, you are presented with a series of absolute facts and asked to synthesize them into a single, undeniable conclusion. You must act as a strict accountant of the facts; you cannot bring in outside assumptions or make leaps of faith. Let’s map the biological chain reaction provided:</p>
<ul>
<li><strong>Fact 1:</strong> Native tube worms completely lack a digestive tract.</li>
<li><strong>Fact 2:</strong> Instead, they rely entirely on symbiotic bacteria inside their bodies for nourishment.</li>
<li><strong>Fact 3:</strong> These bacteria survive by converting toxic hydrogen sulfide from the vents into organic carbon.</li>
<li><strong>Fact 4:</strong> If a vent goes dormant and stops emitting hydrogen sulfide, these bacteria rapidly die off.</li>
</ul>
<p>Now, follow the logical domino effect. If the vent goes dormant, the hydrogen sulfide stops. If the hydrogen sulfide stops, the bacteria die (Fact 4). If the bacteria die, the tube worm loses its entire source of nourishment because it doesn't have a digestive tract of its own (Facts 1 &amp; 2).</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The LSAT relentlessly punishes test-takers who ignore extreme language. The word "only" makes this a massive overstep. We know that these specific tube worms rely on bacteria, but the stimulus provides absolutely zero information about the rest of the animal kingdom. There could be thousands of other organisms that do the same thing.</p>
<p><strong>B)</strong> Correct. This is a direct deduction based on our factual chain. No hydrogen sulfide → bacteria starve and die → worms lose their sole biological method of getting nourishment → worms die. The worms' survival is mechanically tethered to the presence of hydrogen sulfide.</p>
<p><strong>C)</strong> Incorrect. This actively contradicts the information from the text, meaning it is anti-supported. The stimulus tells us that without the specific hydrogen sulfide emitted from the vents, the bacteria "rapidly die off." Therefore, they cannot just pack up and survive in a normal ocean environment.</p>
<p><strong>D)</strong> Incorrect. This is anti-supported. The stimulus explicitly states they "completely lack" a digestive tract. There is absolutely zero evidence in the text to suggest they possess the evolutionary magic to instantly grow one when their food source disappears.</p>
<p><strong>E)</strong> Incorrect. This is another extreme language trap. The stimulus says the hydrogen sulfide is "toxic," but jumping to the absolute conclusion that it is toxic to "all marine life" except these two specific organisms is a massive assumption that goes far beyond the provided text.</p>`,
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
          "If anything, this slightly strengthens the idea that face-to-face collaboration is happening. While it might suggest the managers (rather than the open-plan office) are the true cause of the shift, it doesn't attack the core assumption that face-to-face interaction is actually occurring. We want to destroy that assumption.",
      },
      {
        letter: "B",
        text: "The total volume of emails sent to clients outside of the tech company has remained exactly the same since the transition.",
        explanation:
          "This is completely out of scope. The conclusion is strictly about the \"collaborative environment among the staff\" (internal communication). How they email external clients has no bearing on whether they are talking face-to-face internally.",
      },
      {
        letter: "C",
        text: "Since the open-plan office was implemented, employees have begun wearing noise-canceling headphones and communicating through a newly installed, silent instant-messaging software to avoid disturbing others.",
        explanation:
          "This is a weakener. It provides a perfect alternate explanation for the 40% drop in emails: employees switched to instant messaging, not face-to-face talking. Furthermore, it explicitly destroys the conclusion by revealing that employees are wearing noise-canceling headphones to avoid talking to each other. The open-plan office didn't foster face-to-face collaboration; it completely killed it.",
      },
      {
        letter: "D",
        text: "Several competing tech companies have also adopted open-plan offices to encourage staff collaboration.",
        explanation:
          "What competing companies are doing, or what their intentions are, is completely irrelevant to the actual outcome at this specific tech company.",
      },
      {
        letter: "E",
        text: "Employees reported feeling slightly more distracted by background noise during their first week in the open-plan office.",
        explanation:
          "While being distracted is a negative side effect, this doesn't explain the 40% drop in emails, nor does it support that they aren't collaborating face-to-face. While answer C is a direct, mechanical attack on the conclusion, this answer choice is irrelevant.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Weaken. This stimulus presents a classic "Correlation vs. Causation" flaw. Let's break down the management's logic:</p>
<ul>
<li><strong>Premise 1 (The Change):</strong> The company switched to an open-plan office layout.</li>
<li><strong>Premise 2 (The Data):</strong> Employees are sending 40% fewer emails to each other.</li>
<li><strong>Conclusion (The Causal Claim):</strong> The open-plan office successfully fostered a more direct, face-to-face collaborative environment.</li>
</ul>
<p>Management sees that emails went down and immediately assumes this happened because people are talking face-to-face. To severely weaken this argument, we can introduce an alternate cause. We are looking for an answer choice that explains why the email volume dropped by 40% in a way that proves they are NOT collaborating face-to-face.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. If anything, this slightly strengthens the idea that face-to-face collaboration is happening. While it might suggest the managers (rather than the open-plan office) are the true cause of the shift, it doesn't attack the core assumption that face-to-face interaction is actually occurring. We want to destroy that assumption.</p>
<p><strong>B)</strong> Incorrect. This is completely out of scope. The conclusion is strictly about the "collaborative environment among the staff" (internal communication). How they email external clients has no bearing on whether they are talking face-to-face internally.</p>
<p><strong>C)</strong> Correct. This is a weakener. It provides a perfect alternate explanation for the 40% drop in emails: employees switched to instant messaging, not face-to-face talking. Furthermore, it explicitly destroys the conclusion by revealing that employees are wearing noise-canceling headphones to avoid talking to each other. The open-plan office didn't foster face-to-face collaboration; it completely killed it.</p>
<p><strong>D)</strong> Incorrect. What competing companies are doing, or what their intentions are, is completely irrelevant to the actual outcome at this specific tech company.</p>
<p><strong>E)</strong> Incorrect. While being distracted is a negative side effect, this doesn't explain the 40% drop in emails, nor does it support that they aren't collaborating face-to-face. While answer C is a direct, mechanical attack on the conclusion, this answer choice is irrelevant.</p>`,
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
          "The historical accuracy of the poem itself is totally irrelevant and the historian never presumes it is accurate. The mere fact that the poem was written in the script is the evidence the historian is using. Whether the poem tells the truth or not doesn't change the flaw in the historian's reasoning, which is using one singular example as a way to discredit a general pattern.",
      },
      {
        letter: "B",
        text: "takes evidence showing that a script was used for one specific purpose as proof that it was not used for another, entirely different purpose.",
        explanation:
          "This perfectly describes the structural fallacy. The historian takes the evidence of the script's use for poetry (one specific purpose) and uses it as absolute proof that it was never used for accounting (another, entirely different purpose). It ignores the obvious reality that a written language can be used for multiple things simultaneously.",
      },
      {
        letter: "C",
        text: "attacks the scholars' credentials rather than addressing the physical evidence of the ledger tablets.",
        explanation:
          "This describes a Source Attack/Ad Hominem flaw. The historian never attacks the scholars personally or questions their credentials; the historian just misinterprets archaeological evidence to say they are wrong.",
      },
      {
        letter: "D",
        text: "assumes that everyday accounting and trade were not important aspects of the ancient Chola society.",
        explanation:
          "The historian doesn't make any value judgment or assumptions on the importance of accounting in Chola society. The historian just erroneously concludes that their specific script wasn't used to conduct that accounting.",
      },
      {
        letter: "E",
        text: "fails to consider that the massive stone monument might have been carved by a society other than the Chola.",
        explanation:
          "While the argument fails to consider this possibility, it is not important who carved it. The stimulus explicitly states that the monument was inscribed with a \"highly stylized Chola script poem.\" Even if a different society carved it, they still used the Chola script to do it, and we are trying to figure out the role of the Chola script. This doesn't address the core logical leap of concluding the script was never used for accounting.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Flaw. You must identify the exact structural error in the historian's logic. Let's map the argument:</p>
<ul>
<li><strong>Scholars' Claim (Context - Other Perspective’s Argument):</strong> Chola script was used primarily for everyday accounting/trade (supported by an abundance of small ledger tablets).</li>
<li><strong>Historian's Counter-Evidence:</strong> We just found a massive ceremonial monument with a Chola script poem on it.</li>
<li><strong>Historian's Conclusion:</strong> Therefore, the Chola script was never used for everyday accounting purposes.</li>
</ul>
<p>The historian's logic is wildly disproportionate. The scholars never claimed the script was only used for accounting; they claimed it was primarily used for it. The historian finds one single instance of the script being used for poetry and uses it to completely erase the existence of the accounting tablets. The fatal flaw here is assuming that because a tool (the script) was used for one specific grand purpose, it couldn't possibly have been used for mundane, everyday purposes as well.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The historical accuracy of the poem itself is totally irrelevant and the historian never presumes it is accurate. The mere fact that the poem was written in the script is the evidence the historian is using. Whether the poem tells the truth or not doesn't change the flaw in the historian's reasoning, which is using one singular example as a way to discredit a general pattern.</p>
<p><strong>B)</strong> Correct. This perfectly describes the structural fallacy. The historian takes the evidence of the script's use for poetry (one specific purpose) and uses it as absolute proof that it was never used for accounting (another, entirely different purpose). It ignores the obvious reality that a written language can be used for multiple things simultaneously.</p>
<p><strong>C)</strong> Incorrect. This describes a Source Attack/Ad Hominem flaw. The historian never attacks the scholars personally or questions their credentials; the historian just misinterprets archaeological evidence to say they are wrong.</p>
<p><strong>D)</strong> Incorrect. The historian doesn't make any value judgment or assumptions on the importance of accounting in Chola society. The historian just erroneously concludes that their specific script wasn't used to conduct that accounting.</p>
<p><strong>E)</strong> Incorrect. While the argument fails to consider this possibility, it is not important who carved it. The stimulus explicitly states that the monument was inscribed with a "highly stylized Chola script poem." Even if a different society carved it, they still used the Chola script to do it, and we are trying to figure out the role of the Chola script. This doesn't address the core logical leap of concluding the script was never used for accounting.</p>`,
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
          "Let's apply the Negation Test. What if the root-borer is not the single greatest threat (maybe drought is worse)? Does that destroy the conclusion? No. As long as the root-borer is a threat, switching to a pesticide that handles it better could still significantly increase yields. Extreme language like \"single greatest\" is rarely a necessary assumption, since we don’t need the insect to be the greatest threat in the region.",
      },
      {
        letter: "B",
        text: "The new bio-pesticide is less expensive for farmers to purchase and apply than traditional chemical pesticides.",
        explanation:
          "The conclusion is strictly about agricultural biology—specifically, an increase in \"overall corn crop yield.\" The financial cost of the pesticide has absolutely no mechanical bearing on how tall the corn grows, so it would make no sense for the argument to have to assume anything about this.",
      },
      {
        letter: "C",
        text: "The new bio-pesticide does not contain chemicals that directly inhibit the corn plant's ability to absorb nutrients from the soil.",
        explanation:
          "Apply the Negation Test. What if this assumption wasn’t true? What if the new bio-pesticide DOES contain chemicals that directly inhibit the corn plant's ability to absorb nutrients? If this is true, it doesn't matter that the beneficial microbes survived; the plant still can't absorb nutrients, and the crop yield won’t improve. Because negating this answer choice completely destroys the author's conclusion, it is an absolutely necessary, load-bearing assumption.",
      },
      {
        letter: "D",
        text: "Beneficial soil microbes are incapable of surviving in soil that has been treated with any type of chemical synthetic.",
        explanation:
          "Another extreme language trap (\"incapable\", \"any type\"). We only care about the traditional chemical pesticides mentioned in the stimulus, not \"any type\" of synthetic in existence.",
      },
      {
        letter: "E",
        text: "Farmers who currently use traditional chemical pesticides are dissatisfied with their overall corn crop yields.",
        explanation:
          "Subjective human emotions (\"dissatisfied\") do not dictate agricultural science. A farmer could be perfectly satisfied with a mediocre yield, but the bio-pesticide could still mechanically increase it. The argument does not need to assume anything about what farmers think of their crop yields right now.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Necessary Assumption. This is a classic "new solution" stimulus. The author presents a problem and champions a new product as the ultimate fix. Let's map the mechanics:</p>
<ul>
<li><strong>Premise 1:</strong> The new bio-pesticide protects corn from the root-borer AND does not harm beneficial soil microbes.</li>
<li><strong>Premise 2:</strong> Traditional chemical pesticides kill the root-borer BUT severely deplete those microbes.</li>
<li><strong>Premise 3:</strong> Those microbes are essential for maximizing the corn's nutrient absorption.</li>
<li><strong>Conclusion:</strong> Therefore, switching to the new bio-pesticide will undoubtedly result in a significant increase in overall corn crop yield.</li>
</ul>
<p>The author assumes that because the new bio-pesticide solves the specific problem caused by the old pesticide (the death of the microbes), it is a flawless product that will absolutely guarantee a higher yield. But what if the new bio-pesticide introduces a brand-new, completely different problem? What if it saves the microbes but actively poisons the corn plant itself? For the conclusion to even be possible, the author must assume that the new product doesn't have any hidden, catastrophic side effects that would ruin the crop yield anyway.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. Let's apply the Negation Test. What if the root-borer is not the single greatest threat (maybe drought is worse)? Does that destroy the conclusion? No. As long as the root-borer is a threat, switching to a pesticide that handles it better could still significantly increase yields. Extreme language like "single greatest" is rarely a necessary assumption, since we don’t need the insect to be the greatest threat in the region.</p>
<p><strong>B)</strong> Incorrect. The conclusion is strictly about agricultural biology—specifically, an increase in "overall corn crop yield." The financial cost of the pesticide has absolutely no mechanical bearing on how tall the corn grows, so it would make no sense for the argument to have to assume anything about this.</p>
<p><strong>C)</strong> Correct. Apply the Negation Test. What if this assumption wasn’t true? What if the new bio-pesticide DOES contain chemicals that directly inhibit the corn plant's ability to absorb nutrients? If this is true, it doesn't matter that the beneficial microbes survived; the plant still can't absorb nutrients, and the crop yield won’t improve. Because negating this answer choice completely destroys the author's conclusion, it is an absolutely necessary, load-bearing assumption.</p>
<p><strong>D)</strong> Incorrect. Another extreme language trap ("incapable", "any type"). We only care about the traditional chemical pesticides mentioned in the stimulus, not "any type" of synthetic in existence.</p>
<p><strong>E)</strong> Incorrect. Subjective human emotions ("dissatisfied") do not dictate agricultural science. A farmer could be perfectly satisfied with a mediocre yield, but the bio-pesticide could still mechanically increase it. The argument does not need to assume anything about what farmers think of their crop yields right now.</p>`,
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
          "This is a flawless 1-to-1 structural match.\nRule: Solar Panels → Eligible for Credit.\nApplication: Smith currently has Solar Panels.\nFlawed Conclusion: If Smith loses Solar Panels (removes them) → No longer Eligible. It commits the exact same Mistaken Negation and perfectly mirrors the chronological structure of possessing a sufficient condition and then removing it.",
      },
      {
        letter: "B",
        text: "Anyone who completes the advanced driver's training course receives a discount on their auto insurance. Sarah received a discount on her auto insurance. Therefore, Sarah must have completed the advanced driver's training course.",
        explanation:
          "This commits a Mistaken Reversal, not a Mistaken Negation. It says: Course → Discount. Sarah got a discount. Therefore, Sarah took the course. Just because you meet the necessary condition does not mean you meet the sufficient condition. It’s necessary to be in the U.S to be in New York, that doesn’t mean being in the U.S guarantees being in the U.S. This is not the same flaw as our stimulus.",
      },
      {
        letter: "C",
        text: "If a restaurant passes its municipal health inspection, it is allowed to remain open. The downtown diner failed its health inspection. Therefore, the downtown diner will be forced to close.",
        explanation:
          "While this is a Mistaken Negation (Pass → Open. Failed → Close), it fails to match the chronological narrative structure which you also need in a Parallel Flaw question. The stimulus had a subject who currently possessed the condition and then lost it. Here, the diner just flat-out fails from the start. Answer A is a parallel because it matches the structure of our stimulus while this doesn’t.",
      },
      {
        letter: "D",
        text: "All registered voters are allowed to participate in the upcoming mayoral election. John is not a registered voter. Therefore, if John registers to vote tomorrow, he will be allowed to participate in the election.",
        explanation:
          "This reverses the chronology. It starts with a subject who does not have the condition, and proposes that gaining it will lead to the result. We need a subject who has the condition and loses it. This answer choice is not flawed and makes a valid argument, so it cannot possibly be the correct answer.",
      },
      {
        letter: "E",
        text: "Any student who maintains a perfect grade point average earns a spot on the dean's list. Leo is on the dean's list. Therefore, if Leo's grade point average drops, he will be removed from the dean's list.",
        explanation:
          "This mixes the logic up. It says: Perfect GPA → Dean's List. It then establishes that Leo has the necessary condition (he is on the list), and concludes that if he loses the sufficient condition (GPA drops), he loses the necessary condition. However in this choice, it was never established that Leo even had met the sufficient condition (maintained a perfect GPA) while in our stimulus, Mark possessed a red badge. It is entirely possible that Leo is on the dean’s list for another reason, such as doing great extracurricular work throughout this degree. This choice is not a hypothetical Mistaken Negation of the sufficient condition like the stimulus committed.",
      },
    ],
    correctAnswer: "A",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Parallel Flaw. To solve this, you must abstract the underlying formal logic of the stimulus and find the answer choice that commits the exact same mathematical error. Let's diagram the Corporate Policy:</p>
<ul>
<li><strong>The Rule:</strong> Possess Red Badge → Authorized to Access Server Room. (Red Badge is a sufficient condition for access, meaning it guarantees access).</li>
<li><strong>The Application:</strong> Mark currently possesses a Red Badge.</li>
<li><strong>The Flawed Conclusion:</strong> If Mark's Red Badge is deactivated (he loses it), he will no longer be authorized to access the server room. The argument misses that there could be other things Mark has that also guarantee he has authorization, such as his job position.</li>
</ul>
<p>This is a textbook Mistaken Negation. The author assumes that because a Red Badge is sufficient to grant access, it is the only way to get access (necessary). But what if Mark is also the CEO? Or what if he also has a Blue Badge that grants access? Losing the Red Badge doesn't definitively prove he loses access.</p>
<p>Furthermore, note the chronological narrative structure: The subject currently has the sufficient condition, and the conclusion imagines them losing it to trigger that the necessary condition is also lost.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Correct. This is a flawless 1-to-1 structural match.
Rule: Solar Panels → Eligible for Credit.
Application: Smith currently has Solar Panels.
Flawed Conclusion: If Smith loses Solar Panels (removes them) → No longer Eligible. It commits the exact same Mistaken Negation and perfectly mirrors the chronological structure of possessing a sufficient condition and then removing it.</p>
<p><strong>B)</strong> Incorrect. This commits a Mistaken Reversal, not a Mistaken Negation. It says: Course → Discount. Sarah got a discount. Therefore, Sarah took the course. Just because you meet the necessary condition does not mean you meet the sufficient condition. It’s necessary to be in the U.S to be in New York, that doesn’t mean being in the U.S guarantees being in the U.S. This is not the same flaw as our stimulus.</p>
<p><strong>C)</strong> Incorrect. While this is a Mistaken Negation (Pass → Open. Failed → Close), it fails to match the chronological narrative structure which you also need in a Parallel Flaw question. The stimulus had a subject who currently possessed the condition and then lost it. Here, the diner just flat-out fails from the start. Answer A is a parallel because it matches the structure of our stimulus while this doesn’t.</p>
<p><strong>D)</strong> Incorrect. This reverses the chronology. It starts with a subject who does not have the condition, and proposes that gaining it will lead to the result. We need a subject who has the condition and loses it. This answer choice is not flawed and makes a valid argument, so it cannot possibly be the correct answer.</p>
<p><strong>E)</strong> Incorrect. This mixes the logic up. It says: Perfect GPA → Dean's List. It then establishes that Leo has the necessary condition (he is on the list), and concludes that if he loses the sufficient condition (GPA drops), he loses the necessary condition. However in this choice, it was never established that Leo even had met the sufficient condition (maintained a perfect GPA) while in our stimulus, Mark possessed a red badge. It is entirely possible that Leo is on the dean’s list for another reason, such as doing great extracurricular work throughout this degree. This choice is not a hypothetical Mistaken Negation of the sufficient condition like the stimulus committed.</p>`,
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
          "Being \"known to avoid\" something is not a mathematical guarantee. We need 100% certainty to bridge a Sufficient Assumption gap. The artist could have made an exception for this one piece.",
      },
      {
        letter: "B",
        text: "No painting created in the 19th century or later utilizes genuine lapis lazuli pigment.",
        explanation:
          "This is just a contrapositive of our Premise 1 (Lapis Lazuli → Painted Prior to 19th Century) and does nothing to connect the specific painting (Azure Dreams) to the conclusion. With this answer choice, we still don’t know whether the specific painting uses an abstract geometric style or when it was created.",
      },
      {
        letter: "C",
        text: "The recently discovered painting Azure Dreams features the abstract geometric style.",
        explanation:
          "This is the missing trigger. If Azure Dreams is Abstract Geometric, it plugs perfectly into the front of our contrapositive chain and we can know for sure the guarantees follow (Abstract Geometric → /Prior to 19th Century → /Lapis Lazuli). Now we know Azure Dreams did not use Lapis Lazuli pigment. The conclusion is now undeniable based on the conditional rules.",
      },
      {
        letter: "D",
        text: "If a painting does not feature the abstract geometric style, it must have been painted prior to the 19th century.",
        explanation:
          "This is a Mistaken Reversal of Premise 2 (Painted Prior to 19th Century ← /Abstract Geometric Style). Giving us a different version of an existing rule does not help us prove anything about Azure Dreams.",
      },
      {
        letter: "E",
        text: "Some aspects of the recently discovered painting Azure Dreams were painted using synthetic blue pigments rather than genuine lapis lazuli.",
        explanation:
          "This choice only tells us that some parts of Azure Dreams were painted with synthetic blue pigments. That does not rule out the possibility that other parts of the painting use genuine lapis lazuli, so it fails to support the conclusion that the painting does not utilize genuine lapis lazuli pigment at all.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Sufficient Assumption. This is a pure formal logic chain. The author is trying to prove a conclusion, but there is a hole in the conditional chain. Your job is to find the mathematical link that bridges the premises directly to the conclusion with 100% certainty. Let's diagram the rules:</p>
<ul>
<li><strong>Premise 1:</strong> Lapis Lazuli → Painted Prior to 19th Century</li>
<li><strong>Premise 2:</strong> Painted Prior to 19th Century → /Abstract Geometric Style.</li>
<li><strong>The Chain:</strong> Lapis Lazuli → Prior to 19th Century → /Abstract Geometric Style.</li>
<li><strong>In Other Words (Contrapositive Chain):</strong> Abstract Geometric Style → /Prior to 19th Century → /Lapis Lazuli</li>
<li><strong>The Conclusion:</strong> Azure Dreams/Lapis Lazuli</li>
</ul>
<p>To prove that Azure Dreams does not use Lapis Lazuli, we need to trigger our Contrapositive Chain. How do we start that chain? By proving that Azure Dreams is of abstract geometric style or NOT prior to the 19th century, that will guarantee it cannot possibly contain Lapis Lazuli.</p>
<p>We are looking for either:</p>
<p>Azure DreamsAbstract Geometric Style</p>
<p>Azure Dreams/Prior to 19th Century</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. Being "known to avoid" something is not a mathematical guarantee. We need 100% certainty to bridge a Sufficient Assumption gap. The artist could have made an exception for this one piece.</p>
<p><strong>B)</strong> Incorrect. This is just a contrapositive of our Premise 1 (Lapis Lazuli → Painted Prior to 19th Century) and does nothing to connect the specific painting (Azure Dreams) to the conclusion. With this answer choice, we still don’t know whether the specific painting uses an abstract geometric style or when it was created.</p>
<p><strong>C)</strong> Correct. This is the missing trigger. If Azure Dreams is Abstract Geometric, it plugs perfectly into the front of our contrapositive chain and we can know for sure the guarantees follow (Abstract Geometric → /Prior to 19th Century → /Lapis Lazuli). Now we know Azure Dreams did not use Lapis Lazuli pigment. The conclusion is now undeniable based on the conditional rules.</p>
<p><strong>D)</strong> Incorrect. This is a Mistaken Reversal of Premise 2 (Painted Prior to 19th Century ← /Abstract Geometric Style). Giving us a different version of an existing rule does not help us prove anything about Azure Dreams.</p>
<p><strong>E)</strong> Incorrect. This choice only tells us that some parts of Azure Dreams were painted with synthetic blue pigments. That does not rule out the possibility that other parts of the painting use genuine lapis lazuli, so it fails to support the conclusion that the painting does not utilize genuine lapis lazuli pigment at all.</p>`,
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
          "This describes an Ad Hominem attack. The advocate attacks the bus route and its consequences, not the Director personally.",
      },
      {
        letter: "B",
        text: "treats a condition that is sufficient to make a transit system efficient as a condition that is necessary for it to be efficient.",
        explanation:
          "There is no formal conditional logic (if/then statements) operating in this argument, so there cannot possibly have been a sufficiency/necessity confusion.",
      },
      {
        letter: "C",
        text: "relies on a shifting definition of the term \"efficient\" to refute the transit director's claim.",
        explanation:
          "This flawlessly describes the Equivocation fallacy. The advocate shifts the definition of \"efficient\" from what the Director meant (speed/travel time) to a completely different metric (social equity/comprehensive coverage) in order to draw their conclusion and attack the Director’s conclusion.",
      },
      {
        letter: "D",
        text: "fails to consider that the old local route might have been even less reliable for the residents of the lower-income districts.",
        explanation:
          "While this might be a factual possibility that the citizen advocate didn’t consider, it doesn't address the underlying structural flaw in how the advocate constructed their rebuttal using the word \"efficient.” The citizen advocate does not need to consider this in his argument, instead he misunderstands a key term that makes it flawed.",
      },
      {
        letter: "E",
        text: "bases a sweeping conclusion about the entire public transportation system on a single, unrepresentative bus route.",
        explanation:
          "The advocate's conclusion is strictly limited to \"the new express route.\" They explicitly say, \"Therefore, the new express route is not highly efficient at all.\" They do not make a sweeping claim about the entire city transit system. This is not descriptively accurate to the advocate’s argument.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Flaw. Two speakers are looking at the exact same bus route, but talking entirely past each other. We need to identify the structural breakdown in their communication.</p>
<ul>
<li><strong>Transit Director:</strong> The route is highly "efficient" because passengers arrive 20% faster.</li>
<li><strong>Citizen Advocate:</strong> The route is not "efficient" because it bypasses low-income districts and deprives residents of reliable transport.</li>
</ul>
<p>What is happening here? The Director is defining the word "efficient" in terms of chronological speed (getting from point A to point B quickly). The Advocate rebuts the Director by using the exact same word, "efficient," but redefines it to mean equitable social utility (serving the maximum number of people fairly).</p>
<p>This is a classic fallacy known as Equivocation. You cannot logically refute someone's argument by changing the definition of a core term they are using to make their point. If the Director means "speedy" as efficient, the Advocate must prove it isn't "speedy."</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. This describes an Ad Hominem attack. The advocate attacks the bus route and its consequences, not the Director personally.</p>
<p><strong>B)</strong> Incorrect. There is no formal conditional logic (if/then statements) operating in this argument, so there cannot possibly have been a sufficiency/necessity confusion.</p>
<p><strong>C)</strong> Correct. This flawlessly describes the Equivocation fallacy. The advocate shifts the definition of "efficient" from what the Director meant (speed/travel time) to a completely different metric (social equity/comprehensive coverage) in order to draw their conclusion and attack the Director’s conclusion.</p>
<p><strong>D)</strong> Incorrect. While this might be a factual possibility that the citizen advocate didn’t consider, it doesn't address the underlying structural flaw in how the advocate constructed their rebuttal using the word "efficient.” The citizen advocate does not need to consider this in his argument, instead he misunderstands a key term that makes it flawed.</p>
<p><strong>E)</strong> Incorrect. The advocate's conclusion is strictly limited to "the new express route." They explicitly say, "Therefore, the new express route is not highly efficient at all." They do not make a sweeping claim about the entire city transit system. This is not descriptively accurate to the advocate’s argument.</p>`,
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
          "This commits a fatal logical flaw known as confusing sufficiency for necessity (A → B, B happened, therefore A). The stimulus was a valid logical deduction; this answer choice is flawed so it cannot be parallel.",
      },
      {
        letter: "B",
        text: "If the car's engine had a cracked block, the vehicle would have overheated during the steep mountain climb. The vehicle did not overheat during a climb. Therefore, since the car was definitively driven up the steep mountain, the engine must not have a cracked block.",
        explanation:
          "This is a flawless, 1-to-1 structural match.\nRule: Cracked Block → Overheat.\nPremise 2: Did NOT overheat.\nTrigger Confirmation: The car was definitively driven up the steep mountain (the test condition was met).\nConclusion: Therefore, NOT a cracked block.",
      },
      {
        letter: "C",
        text: "If the software update had been properly tested, it would not have caused the servers to crash. The servers crashed immediately after the update. Therefore, the software update must not have been properly tested.",
        explanation:
          "While this is a valid application of not meeting a necessary condition (Tested → No Server Crash. Servers Crashed. Therefore, Not Tested), it is missing the third structural element: the Trigger Confirmation. It lacks the structural equivalent of \"since the trail mix contained peanuts.\"",
      },
      {
        letter: "D",
        text: "If the vault had been breached by a professional thief, the alarm wires would have been cleanly cut. The alarm wires were not cleanly cut. Therefore, the vault was likely breached by an amateur.",
        explanation:
          "First, it is missing the Trigger Confirmation (structural equivalent) just like choice C. Second, it shifts the degree of certainty in the conclusion. The stimulus concluded with absolute certainty (\"must not have\"), while this choice concluded with a probabilistic claim (\"was likely breached\"). In Parallel Reasoning, the degree of certainty must match perfectly.",
      },
      {
        letter: "E",
        text: "If the river floods, the nearby crops will be destroyed. The crops were completely destroyed. Therefore, since the valley experienced heavy rainfall, the river must have flooded.",
        explanation:
          "Just like choice A, this commits the fallacy of confusing sufficiency for necessity (Floods → Destroyed. Destroyed, Therefore, Floods). Just because you meet a necessary condition does not mean you meet the sufficient condition. It ignores the possibility of alternate causes for why the crops could have been destroyed (like locusts or fire destroying the crops). In addition, just saying there was heavy rainfall doesn’t mean the river flooded. Because we have a flawed argument, it cannot match our stimulus.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Parallel Reasoning. Your goal is to dissect the exact formal logic structure of the stimulus and find the answer choice that perfectly mirrors its mechanical skeleton. We are given valid arguments in Parallel Reasoning questions. Any flawed answer choices cannot be correct. Now, let's diagram the argument:</p>
<ul>
<li><strong>Premise 1 (The Rule):</strong> Severe Allergy → Immediate Anaphylaxis.</li>
<li><strong>Premise 2:</strong> The patient did NOT experience anaphylaxis.</li>
<li><strong>Premise 3 (The Trigger Confirmation):</strong> The patient definitively ate heavily roasted peanuts (the condition necessary to test the rule was met).</li>
<li><strong>Conclusion:</strong> Therefore, the patient does NOT have a severe allergy.</li>
</ul>
<p>This is a flawless application of Modus Tollens (denying the consequent), but it features a crucial third element: the Trigger Confirmation. It isn't enough to just say A → B, Not B, therefore Not A." The argument specifically goes out of its way to prove that the test was valid by confirming the patient actually interacted with the peanuts. We need an answer choice with this exact three-part structure.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. This commits a fatal logical flaw known as confusing sufficiency for necessity (A → B, B happened, therefore A). The stimulus was a valid logical deduction; this answer choice is flawed so it cannot be parallel.</p>
<p><strong>B)</strong> Correct. This is a flawless, 1-to-1 structural match.
Rule: Cracked Block → Overheat.
Premise 2: Did NOT overheat.
Trigger Confirmation: The car was definitively driven up the steep mountain (the test condition was met).
Conclusion: Therefore, NOT a cracked block.</p>
<p><strong>C)</strong> Incorrect. While this is a valid application of not meeting a necessary condition (Tested → No Server Crash. Servers Crashed. Therefore, Not Tested), it is missing the third structural element: the Trigger Confirmation. It lacks the structural equivalent of "since the trail mix contained peanuts."</p>
<p><strong>D)</strong> Incorrect. First, it is missing the Trigger Confirmation (structural equivalent) just like choice C. Second, it shifts the degree of certainty in the conclusion. The stimulus concluded with absolute certainty ("must not have"), while this choice concluded with a probabilistic claim ("was likely breached"). In Parallel Reasoning, the degree of certainty must match perfectly.</p>
<p><strong>E)</strong> Incorrect. Just like choice A, this commits the fallacy of confusing sufficiency for necessity (Floods → Destroyed. Destroyed, Therefore, Floods). Just because you meet a necessary condition does not mean you meet the sufficient condition. It ignores the possibility of alternate causes for why the crops could have been destroyed (like locusts or fire destroying the crops). In addition, just saying there was heavy rainfall doesn’t mean the river flooded. Because we have a flawed argument, it cannot match our stimulus.</p>`,
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
          "This describes a negative side effect for consumers, but it doesn't weaken the claim that the weavers flourished. In fact, if prices rose significantly, the domestic weavers might have been making record profits, which would actually strengthen the historian's claim.",
      },
      {
        letter: "B",
        text: "Many of the newly registered \"weaving guilds\" were actually shell organizations created by smugglers to secretly distribute illegally imported foreign textiles under the guise of domestic production.",
        explanation:
          "This is a devastating attack on the argument’s premise. It greatly brings into question the historian's evidence. The tripling of the guilds wasn't a sign of domestic weavers flourishing; it was just a front for the exact foreign textiles the ban was supposed to stop. This choice directly shows how the premises don’t actually support the conclusion of the argument.",
      },
      {
        letter: "C",
        text: "Prior to the ban, foreign textiles accounted for less than twenty percent of all fabric purchased in Portalis.",
        explanation:
          "Providing baseline data from before the ban doesn't change the historian's evidence about what happened after the ban was implemented. Even if the foreign market share was small, eliminating that percentage could still have allowed domestic weavers to flourish and protected them from eventually being outcompeted.",
      },
      {
        letter: "D",
        text: "The neighboring town of Veridia did not ban foreign textiles, and its local weaving guilds entirely collapsed during the same two-year period.",
        explanation:
          "This actually strengthens the historian's argument by providing a control group where when the proposed cause was absent (no ban), the effect was not seen (local guilds collapsed instead). If a town without the ban collapsed while Portalis grew, it heavily implies the ban was the causal factor for the success.",
      },
      {
        letter: "E",
        text: "The harsh penalties for importing foreign textiles deterred merchants from bringing other, completely legal luxury goods into the port of Portalis.",
        explanation:
          "This points out an unintended economic consequence regarding other goods, but the historian's conclusion is strictly about the success of the local textile economy. What happened to the other markets like the luxury goods market is entirely out of scope and irrelevant to the argument’s conclusion.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Weaken. This is a classic causal question. A ban took place and we saw a result happen. The argument then concluded the ban was responsible for the result. Let's map the Economic Historian's logic:</p>
<ul>
<li><strong>Premise:</strong> Portalis banned foreign textiles.</li>
<li><strong>Premise:</strong> Within two years, the number of registered local weaving guilds tripled.</li>
<li><strong>Conclusion:</strong> The ban was successful. The domestic weavers flourished because foreign competition was eliminated.</li>
</ul>
<p>The historian is looking at a metric (number of registered guilds) and assuming it represents thriving domestic weavers. But what if the evidence is incorrect? What if the "guilds" aren't actually weavers at all? What if there was another cause other than the ban that led to the result? To weaken this argument, we can either directly weaken the connection between the existing premises and the conclusion, or introduce an alternate cause that would indirectly weaken the argument’s support.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. This describes a negative side effect for consumers, but it doesn't weaken the claim that the weavers flourished. In fact, if prices rose significantly, the domestic weavers might have been making record profits, which would actually strengthen the historian's claim.</p>
<p><strong>B)</strong> Correct. This is a devastating attack on the argument’s premise. It greatly brings into question the historian's evidence. The tripling of the guilds wasn't a sign of domestic weavers flourishing; it was just a front for the exact foreign textiles the ban was supposed to stop. This choice directly shows how the premises don’t actually support the conclusion of the argument.</p>
<p><strong>C)</strong> Incorrect. Providing baseline data from before the ban doesn't change the historian's evidence about what happened after the ban was implemented. Even if the foreign market share was small, eliminating that percentage could still have allowed domestic weavers to flourish and protected them from eventually being outcompeted.</p>
<p><strong>D)</strong> Incorrect. This actually strengthens the historian's argument by providing a control group where when the proposed cause was absent (no ban), the effect was not seen (local guilds collapsed instead). If a town without the ban collapsed while Portalis grew, it heavily implies the ban was the causal factor for the success.</p>
<p><strong>E)</strong> Incorrect. This points out an unintended economic consequence regarding other goods, but the historian's conclusion is strictly about the success of the local textile economy. What happened to the other markets like the luxury goods market is entirely out of scope and irrelevant to the argument’s conclusion.</p>`,
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
          "This just explains that the bats and mosquitoes are in the same place at the same time. If anything, this deepens the paradox, making it even more confusing as to why the bats aren't eating them all.",
      },
      {
        letter: "B",
        text: "The county simultaneously banned the use of a harsh chemical pesticide that had previously kept the mosquito population lower than it should be.",
        explanation:
          "This is a very strong distractor. While it does explain why the mosquito population would go up another way (an alternate cause), it completely ignores the bats. Even if the pesticide is now banned, the bats should be bringing the mosquito population down, balancing the effect. However, in the stimulus, we still have a significant rise in mosquito populations. A true resolution will bridge both sides of the paradox, explaining how the introduction of the bats caused or interacted with the rise in mosquitoes.",
      },
      {
        letter: "C",
        text: "The introduced brown bats prey heavily on a specific type of airborne dragonfly that is the primary natural predator of mosquito larvae.",
        explanation:
          "This resolves the paradox brilliantly by introducing an ecological chain reaction. The bats didn't just eat mosquitoes; they primarily ate the dragonflies. Because the dragonflies were the primary predator of mosquito larvae, killing the dragonflies removed the main ceiling on the mosquito population, allowing them to breed out of control. The bats accidentally protected the mosquitoes.",
      },
      {
        letter: "D",
        text: "Mosquitoes are capable of reproducing at a much faster rate than brown bats.",
        explanation:
          "This might explain why the bats couldn't drive the mosquitoes to extinction, but it doesn't explain why the mosquito population is significantly larger now than it was before the bats were introduced.",
      },
      {
        letter: "E",
        text: "The brown bats found several alternative food sources in the county, such as moths and beetles, reducing their reliance on mosquitoes.",
        explanation:
          "This explains why the bats thrived without eating mosquitoes. However, even if they just ignored the mosquitoes, the mosquito population should have stayed roughly the same. This choice does not explain the massive increase in mosquitoes since the bats were introduced.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Resolve the Paradox. You are faced with a seemingly contradictory set of facts. Two things are happening simultaneously that shouldn't make sense together.</p>
<ul>
<li><strong>Fact 1:</strong> The county introduced brown bats (voracious mosquito predators). The bats thrived and expanded their territory.</li>
<li><strong>Fact 2:</strong> The mosquito population is now significantly larger than it was before the bats arrived.</li>
</ul>
<p>How can adding a massive number of predators cause the prey population to explode? We need an answer choice that links the success of the bats directly to the unprecedented success of the mosquitoes.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. This just explains that the bats and mosquitoes are in the same place at the same time. If anything, this deepens the paradox, making it even more confusing as to why the bats aren't eating them all.</p>
<p><strong>B)</strong> Incorrect. This is a very strong distractor. While it does explain why the mosquito population would go up another way (an alternate cause), it completely ignores the bats. Even if the pesticide is now banned, the bats should be bringing the mosquito population down, balancing the effect. However, in the stimulus, we still have a significant rise in mosquito populations. A true resolution will bridge both sides of the paradox, explaining how the introduction of the bats caused or interacted with the rise in mosquitoes.</p>
<p><strong>C)</strong> Correct. This resolves the paradox brilliantly by introducing an ecological chain reaction. The bats didn't just eat mosquitoes; they primarily ate the dragonflies. Because the dragonflies were the primary predator of mosquito larvae, killing the dragonflies removed the main ceiling on the mosquito population, allowing them to breed out of control. The bats accidentally protected the mosquitoes.</p>
<p><strong>D)</strong> Incorrect. This might explain why the bats couldn't drive the mosquitoes to extinction, but it doesn't explain why the mosquito population is significantly larger now than it was before the bats were introduced.</p>
<p><strong>E)</strong> Incorrect. This explains why the bats thrived without eating mosquitoes. However, even if they just ignored the mosquitoes, the mosquito population should have stayed roughly the same. This choice does not explain the massive increase in mosquitoes since the bats were introduced.</p>`,
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
          "The sub-conclusion is strictly about decreasing the number of data breaches. Whether the software costs $10 or $10,000,000 is completely irrelevant to its mechanical ability to stop hackers. The argument never argues we should transition to ‘Titan’ because of cost savings, rather only for its increased protection.",
      },
      {
        letter: "B",
        text: "Have any other firms in the same industry recently transitioned to the 'Titan' operating system?",
        explanation:
          "The actions of other firms have no bearing on the objective security mechanics of this specific firm's network which is what the argument is discussing.",
      },
      {
        letter: "C",
        text: "Will the transition process require the network to be temporarily taken offline during business hours?",
        explanation:
          "This is an administrative logistical issue. Temporary downtime does not evaluate whether the software will successfully stop hackers once it is installed and running.",
      },
      {
        letter: "D",
        text: "Were the majority of the firm's past external data breaches the result of employees falling victim to social engineering tactics that bypass data encryption?",
        explanation:
          "Apply the Variance Test (answer the question with two extremes).\nIf the answer is YES: The past breaches happened because employees gave away their passwords (bypassing encryption). In this case, installing Titan's uncrackable encryption is useless, and the executive's argument is destroyed.\nIf the answer is NO: The breaches were NOT social engineering; they were direct attacks on the encryption itself. In this case, installing Titan will fix the problem, and the executive's argument is heavily strengthened. Because this question helps evaluate the strength of this argument, it is the correct answer.",
      },
      {
        letter: "E",
        text: "Does the 'Titan' operating system offer any productivity features beyond its military-grade data encryption?",
        explanation:
          "Again, productivity features (like better word processors or faster load times) are a nice bonus, but they are entirely irrelevant to the specific claim about decreasing external data breaches.",
      },
    ],
    correctAnswer: "D",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Evaluate the Argument. In this question type, you are looking for the core assumptions of the argument and finding a question in the answer choices that once answered, would help confirm or deny those assumptions. The correct answer will be a question where, depending on whether you answer "Yes" or "No," the argument is either validated or destroyed. Let's find the executive's logical gap:</p>
<ul>
<li><strong>Premise:</strong> Titan OS features military-grade encryption that is mathematically impossible for hackers to crack.</li>
<li><strong>Sub-Conclusion:</strong> Transitioning to Titan will significantly decrease our massive number of external data breaches.</li>
<li><strong>Conclusion:</strong> We must immediately transition our entire corporate network to the newly released 'Titan' operating system.</li>
<li><strong>The executive is assuming a causal link:</strong> Our breaches are happening because our encryption is weak. But what if hackers aren't breaking the encryption at all? What if they are just stealing passwords from naive employees? If the hackers have the keys to the front door, it doesn't matter how thick the vault's steel is.</li>
</ul>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The sub-conclusion is strictly about decreasing the number of data breaches. Whether the software costs $10 or $10,000,000 is completely irrelevant to its mechanical ability to stop hackers. The argument never argues we should transition to ‘Titan’ because of cost savings, rather only for its increased protection.</p>
<p><strong>B)</strong> Incorrect. The actions of other firms have no bearing on the objective security mechanics of this specific firm's network which is what the argument is discussing.</p>
<p><strong>C)</strong> Incorrect. This is an administrative logistical issue. Temporary downtime does not evaluate whether the software will successfully stop hackers once it is installed and running.</p>
<p><strong>D)</strong> Correct. Apply the Variance Test (answer the question with two extremes).
If the answer is YES: The past breaches happened because employees gave away their passwords (bypassing encryption). In this case, installing Titan's uncrackable encryption is useless, and the executive's argument is destroyed.
If the answer is NO: The breaches were NOT social engineering; they were direct attacks on the encryption itself. In this case, installing Titan will fix the problem, and the executive's argument is heavily strengthened. Because this question helps evaluate the strength of this argument, it is the correct answer.</p>
<p><strong>E)</strong> Incorrect. Again, productivity features (like better word processors or faster load times) are a nice bonus, but they are entirely irrelevant to the specific claim about decreasing external data breaches.</p>`,
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
          "This flawlessly describes the student's rebuttal. The \"new physical evidence\" is the tree-ring data. It directly contradicts the conclusion because the professor claimed there was a \"catastrophic, decades-long drought,\" and the student proves there was actually \"higher-than-average rainfall.\" The student also introduces more evidence that suggests it was coastal raiders that caused abandonment.",
      },
      {
        letter: "B",
        text: "Identifying a logical inconsistency within the professor's explanation of why the agricultural settlements were abandoned.",
        explanation:
          "A logical inconsistency means the professor's own rules contradict themselves. That didn't happen here. The professor's logic (drought caused the abandonment) makes perfect internal sense; the student is just pointing out that the underlying facts of the timeline are factually false.",
      },
      {
        letter: "C",
        text: "Questioning the reliability of the archaeological methods used to determine the exact date of the agricultural settlements.",
        explanation:
          "The student does not dispute the dates. In fact, the student relies on them, specifically citing tree-ring data covering \"that exact time period\" to make their counter-argument.",
      },
      {
        letter: "D",
        text: "Arguing that the professor has confused a necessary condition for societal collapse with a sufficient one.",
        explanation:
          "There is no formal conditional logic (necessary/sufficient conditions) being debated here, just historical cause and effect.",
      },
      {
        letter: "E",
        text: "Suggesting an alternate cause for a historical phenomenon while completely accepting the environmental data the professor cited.",
        explanation:
          "The student absolutely does not accept the environmental data. The professor cited a drought, and the student explicitly refuted it by citing high rainfall.",
      },
    ],
    correctAnswer: "A",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Method of Reasoning. You need to analyze the exact debate tactic the second speaker uses to dismantle the first speaker's argument. Let's map the interaction:</p>
<ul>
<li><strong>Professor's Argument:</strong> Myra collapsed due to a drought. The evidence is the sudden abandonment of agricultural settlements.</li>
<li><strong>Graduate Student's Rebuttal:</strong> Tree-ring data shows high rainfall during that time. Also, we found weapons from invading coastal raiders in the ruins.</li>
</ul>
<p>The student attacks the professor on two fronts. First, the student introduces new physical data (tree rings) to attack the professor's conclusion (that there was a drought). Second, the student provides an alternate explanation for why the settlements were abandoned (raiders) to attack the professor’s premise.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Correct. This flawlessly describes the student's rebuttal. The "new physical evidence" is the tree-ring data. It directly contradicts the conclusion because the professor claimed there was a "catastrophic, decades-long drought," and the student proves there was actually "higher-than-average rainfall." The student also introduces more evidence that suggests it was coastal raiders that caused abandonment.</p>
<p><strong>B)</strong> Incorrect. A logical inconsistency means the professor's own rules contradict themselves. That didn't happen here. The professor's logic (drought caused the abandonment) makes perfect internal sense; the student is just pointing out that the underlying facts of the timeline are factually false.</p>
<p><strong>C)</strong> Incorrect. The student does not dispute the dates. In fact, the student relies on them, specifically citing tree-ring data covering "that exact time period" to make their counter-argument.</p>
<p><strong>D)</strong> Incorrect. There is no formal conditional logic (necessary/sufficient conditions) being debated here, just historical cause and effect.</p>
<p><strong>E)</strong> Incorrect. The student absolutely does not accept the environmental data. The professor cited a drought, and the student explicitly refuted it by citing high rainfall.</p>`,
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
          "What customers do with the bags at home does not weaken the fact that the store successfully reduced the overall number of bags it puts into circulation.",
      },
      {
        letter: "B",
        text: "A competing grocery chain implemented a similar ban on single-use bags and saw a ninety percent reduction in the total number of bags dispensed.",
        explanation:
          "Just because a competitor had a bigger victory (90%) does not mean the retail executive's 80% reduction wasn't also a massive environmental victory.",
      },
      {
        letter: "C",
        text: "Producing a single heavy-duty reusable plastic bag requires fifty times the amount of raw plastic and energy as producing a thin, single-use plastic bag.",
        explanation:
          "This is a weakener. If the store retains 20% of its original bag volume, but each of those new bags costs 50 times more plastic and energy to produce, the store has actually increased its total environmental footprint. Given this new information, the policy became an environmental hazard, greatly hurting the conclusion.",
      },
      {
        letter: "D",
        text: "Many customers occasionally forget to bring their reusable bags from home and are forced to carry their groceries to their cars by hand.",
        explanation:
          "Carrying groceries by hand uses zero plastic. If anything, this slightly strengthens the argument that the policy is helping the environment by forcing people to forgo bags entirely rather than use the reusable ones.",
      },
      {
        letter: "E",
        text: "The grocery chain's profit margins have increased significantly since they began selling the two-dollar reusable bags at checkout.",
        explanation:
          "The conclusion is strictly about \"environmental conservation.\" The fact that the store is also making a profit does not negate the environmental impact of dispensing 80% fewer bags.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Weaken. The author is using a statistical change to declare a real-world victory. Let's break down the logic:</p>
<ul>
<li><strong>Premise:</strong> The store switched from free, thin single-use bags to $2 heavy-duty bags.</li>
<li><strong>Premise:</strong> The total number (volume) of plastic bags dispensed plummeted by 80%.</li>
<li><strong>Conclusion:</strong> The policy has been a massive victory for environmental conservation.</li>
</ul>
<p>The executive is assuming that reducing the raw number of bags automatically equals an environmental win. But what if the new heavy-duty bags are incredibly toxic or resource-intensive? If you drop your bag usage by 80%, you are still dispensing 20% of your original volume. If that remaining 20% is vastly more damaging to the earth than the old thin bags, this isn't a victory at all. We need an answer choice that shows the new bags offset the benefits of the volume drop.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. What customers do with the bags at home does not weaken the fact that the store successfully reduced the overall number of bags it puts into circulation.</p>
<p><strong>B)</strong> Incorrect. Just because a competitor had a bigger victory (90%) does not mean the retail executive's 80% reduction wasn't also a massive environmental victory.</p>
<p><strong>C)</strong> Correct. This is a weakener. If the store retains 20% of its original bag volume, but each of those new bags costs 50 times more plastic and energy to produce, the store has actually increased its total environmental footprint. Given this new information, the policy became an environmental hazard, greatly hurting the conclusion.</p>
<p><strong>D)</strong> Incorrect. Carrying groceries by hand uses zero plastic. If anything, this slightly strengthens the argument that the policy is helping the environment by forcing people to forgo bags entirely rather than use the reusable ones.</p>
<p><strong>E)</strong> Incorrect. The conclusion is strictly about "environmental conservation." The fact that the store is also making a profit does not negate the environmental impact of dispensing 80% fewer bags.</p>`,
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
          "The psychologist never weighs the importance of the two against each other. The psychologist is attempting to use a physical tool to fix a mental health issue, implying both are highly important. We have no evidence to suggest the argument presumes this, so it cannot be correct.",
      },
      {
        letter: "B",
        text: "treats a correlation between a lifestyle habit and a lower incidence of a condition as definitive proof that adopting the habit can cure the condition.",
        explanation:
          "This perfectly captures the flaw structure. It identifies the \"correlation\" (active people happen to have less anxiety) and calls out the massive leap to assuming it acts as a \"cure\" for the condition. That is a massive logical leap and this answer choice describes it.",
      },
      {
        letter: "C",
        text: "attacks the effectiveness of current pharmaceutical treatments for severe chronic anxiety without offering a viable medical alternative.",
        explanation:
          "The psychologist never mentions, attacks, or even alludes to pharmaceutical treatments or any other current medical interventions.",
      },
      {
        letter: "D",
        text: "takes for granted that patients suffering from severe chronic anxiety have the financial means to access strenuous cardiovascular exercise equipment.",
        explanation:
          "The financial or socioeconomic feasibility of the treatment is completely out of scope. The flaw is in the biological and medical logic, not the logistics of accessing exercise equipment.",
      },
      {
        letter: "E",
        text: "assumes that adults who do not engage in strenuous cardiovascular exercise will inevitably develop symptoms of chronic anxiety.",
        explanation:
          "The psychologist never actually assumed this. The psychologist only said that sedentary people are more likely to experience it (using a correlation), to then support using exercise as a cure. The psychologist never said that not exercising makes it an inevitable absolute certainty you will develop anxiety.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Flaw. The psychologist is making a dangerous logical leap from a general observation to a specific medical prescription. Let's map it:</p>
<ul>
<li><strong>Premise (The Survey):</strong> Adults who frequently do strenuous cardio are less likely to report symptoms of chronic anxiety than sedentary adults.</li>
<li><strong>Conclusion (The Prescription):</strong> Psychiatrists should prescribe rigorous cardio to cure patients currently suffering from severe chronic anxiety.</li>
</ul>
<p>There are two major flaws here. First, Correlation vs. Causation. Just because active people have less anxiety doesn't mean the exercise caused the lack of anxiety. It is highly possible that severe anxiety makes a person too exhausted or overwhelmed to engage in strenuous cardio (reverse causality). Second, there is a Prevention vs. Cure flaw. Even if there was causation, and cardio prevented anxiety in healthy adults, there still is no evidence it acts as a "cure" for patients who already suffer from severe clinical cases.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The psychologist never weighs the importance of the two against each other. The psychologist is attempting to use a physical tool to fix a mental health issue, implying both are highly important. We have no evidence to suggest the argument presumes this, so it cannot be correct.</p>
<p><strong>B)</strong> Correct. This perfectly captures the flaw structure. It identifies the "correlation" (active people happen to have less anxiety) and calls out the massive leap to assuming it acts as a "cure" for the condition. That is a massive logical leap and this answer choice describes it.</p>
<p><strong>C)</strong> Incorrect. The psychologist never mentions, attacks, or even alludes to pharmaceutical treatments or any other current medical interventions.</p>
<p><strong>D)</strong> Incorrect. The financial or socioeconomic feasibility of the treatment is completely out of scope. The flaw is in the biological and medical logic, not the logistics of accessing exercise equipment.</p>
<p><strong>E)</strong> Incorrect. The psychologist never actually assumed this. The psychologist only said that sedentary people are more likely to experience it (using a correlation), to then support using exercise as a cure. The psychologist never said that not exercising makes it an inevitable absolute certainty you will develop anxiety.</p>`,
  },
]
