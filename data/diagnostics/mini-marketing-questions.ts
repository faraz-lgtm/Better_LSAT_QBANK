import type { MiniDiagnosticQuestion } from "./mini-marketing-types.ts"

export const MINI_DIAGNOSTIC_QUESTIONS: MiniDiagnosticQuestion[] = [
  {
    sourceItemId: "mini-diag-q1",
    questionNumber: 1,
    targetTimeSeconds: 45,
    difficulty: 1,
    questionType: "Main Conclusion",
    stimulusText: `The new spiced cider at our cafe has been selling out by noon every single day this week. Customers clearly enjoy the taste and are willing to pay a premium for it. Therefore, we ought to double our daily preparation of the spiced cider. After all, maximizing revenue while keeping our customer base satisfied is our primary objective.`,
    stemText:
      "Which one of the following most accurately expresses the main conclusion of the argument?",
    choices: [
      {
        letter: "A",
        text: "The cafe's primary objective is to maximize revenue while keeping customers satisfied.",
        explanation:
          "This is a premise used to justify the conclusion, not the conclusion itself.",
      },
      {
        letter: "B",
        text: "Customers are willing to pay a premium price for the new spiced cider.",
        explanation: "This is another supporting premise.",
      },
      {
        letter: "C",
        text: "The cafe should increase its daily production of spiced cider twofold.",
        explanation:
          'This is a perfect, direct paraphrase of "we ought to double our daily preparation."',
      },
      {
        letter: "D",
        text: "The spiced cider has been selling out by noon every day this week.",
        explanation: "This is just the opening premise.",
      },
      {
        letter: "E",
        text: "Doubling the production of cider is the only way to keep the customer base satisfied.",
        explanation:
          "The author never claims this is the only way to satisfy customers, making this too extreme.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>To crack a Main Conclusion question, you need to separate the premises (the evidence) from the ultimate claim (what the author is trying to prove).</p>
<ul>
<li><strong>Premise 1:</strong> The cider is selling out by noon.</li>
<li><strong>Premise 2:</strong> Customers love it and will pay a premium.</li>
<li><strong>Conclusion:</strong> Therefore, we ought to double our daily preparation of the cider.</li>
<li><strong>Premise 3:</strong> Maximizing revenue and keeping customers satisfied is our primary objective (This acts as a guiding principle supporting the conclusion).</li>
</ul>
<p>The word "Therefore" is your primary structural indicator here. The entire paragraph exists simply to justify the recommendation to make more cider.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. This is a premise used to justify the conclusion, not the conclusion itself.</p>
<p><strong>B)</strong> Incorrect. This is another supporting premise.</p>
<p><strong>C)</strong> Correct. This is a perfect, direct paraphrase of "we ought to double our daily preparation."</p>
<p><strong>D)</strong> Incorrect. This is just the opening premise.</p>
<p><strong>E)</strong> Incorrect. The author never claims this is the only way to satisfy customers, making this too extreme. It fundamentally misstates what the argument attempts to say.</p>`,
  },
  {
    sourceItemId: "mini-diag-q2",
    questionNumber: 2,
    targetTimeSeconds: 60,
    difficulty: 2,
    questionType: "Strengthen",
    stimulusText: `The municipal government recently installed a roundabout at the intersection of Elm and Maple streets. In the six months since the installation, the number of minor traffic collisions at that intersection has dropped by forty percent. The city council contends that the new roundabout is directly responsible for this decline in collisions.`,
    stemText:
      "Which one of the following, if true, provides the most support for the city council's contention?",
    choices: [
      {
        letter: "A",
        text: "Several other intersections in the city that do not have roundabouts also saw a decrease in collisions.",
        explanation:
          "This actually weakens the argument by suggesting a city-wide trend might be the real cause of the drop.",
      },
      {
        letter: "B",
        text: "The total volume of cars traveling through the intersection of Elm and Maple has remained the same over the last year.",
        explanation:
          "By stating that traffic volume stayed the same, this answer destroys the alternate cause of fewer cars, securing the link between the roundabout and the safety improvement.",
      },
      {
        letter: "C",
        text: "Roundabouts are generally less expensive to maintain than traditional traffic lights.",
        explanation: "Cost has absolutely zero impact on the physics of traffic collisions.",
      },
      {
        letter: "D",
        text: "Most drivers in the city prefer traditional traffic lights over roundabouts.",
        explanation:
          "Driver preference is structurally irrelevant to the causal claim about accident rates.",
      },
      {
        letter: "E",
        text: "The speed limit on Elm Street was slightly increased shortly after the roundabout was built.",
        explanation:
          "If speeds increased, we would expect more accidents. This slightly weakens the argument or is at best a distracting paradox.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a classic causal argument that we are asked to strengthen.</p>
<ul>
<li><strong>Premise:</strong> A roundabout was installed.</li>
<li><strong>Premise:</strong> Collisions dropped by 40%.</li>
<li><strong>Conclusion:</strong> The roundabout caused the drop in collisions.</li>
</ul>
<p>The gap here is the assumption that nothing else could have caused the collisions to drop. To strengthen a causal claim on this test, the most common and effective method is to eliminate an alternate cause.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. This actually weakens the argument by suggesting a city-wide trend (like better weather or safer cars) might be the real cause of the drop.</p>
<p><strong>B)</strong> Correct. What is the most obvious alternate reason for accidents dropping? Fewer cars on the road. By explicitly stating that traffic volume stayed the same, this answer destroys that alternate cause, securing the link between the roundabout and the safety improvement.</p>
<p><strong>C)</strong> Incorrect. Cost has absolutely zero impact on the physics of traffic collisions.</p>
<p><strong>D)</strong> Incorrect. Driver preference is structurally irrelevant to the causal claim about accident rates.</p>
<p><strong>E)</strong> Incorrect. If speeds increased, we would expect more accidents. This slightly weakens the argument or is at best a distracting paradox.</p>`,
  },
  {
    sourceItemId: "mini-diag-q3",
    questionNumber: 3,
    targetTimeSeconds: 50,
    difficulty: 2,
    questionType: "Flaw",
    stimulusText: `Everyone who consistently practices the cello develops excellent finger dexterity. Practicing the cello also leads to technical musical expertise. Julian has excellent finger dexterity. Therefore, Julian must consistently practice the cello.`,
    stemText: "The reasoning in the argument is problematic because it",
    choices: [
      {
        letter: "A",
        text: "takes for granted that practicing the cello is the most effective way to develop finger dexterity.",
        explanation:
          'The author doesn\'t care about what is "most effective," only about what Julian specifically does.',
      },
      {
        letter: "B",
        text: "presumes, without providing justification, that Julian has been practicing the cello for a long time.",
        explanation:
          "The argument never presumed that Julian has been practicing for a long time, it only says that Julian consistently practices the cello. Besides, this is not the flaw of the argument.",
      },
      {
        letter: "C",
        text: "treats a condition that is necessary for a phenomenon to occur as a condition that is sufficient to guarantee that phenomenon.",
        explanation:
          'The "phenomenon" is practicing the cello. Finger dexterity is "necessary" for this. The author treats Julian\'s dexterity as "sufficient" to prove he practices the cello. Perfect match.',
      },
      {
        letter: "D",
        text: "attacks Julian's musical abilities rather than addressing the evidence at hand.",
        explanation: "There is no personal attack (ad hominem) in this stimulus.",
      },
      {
        letter: "E",
        text: "draws a conclusion about Julian based on a general rule that only applies to a small group of musicians.",
        explanation: 'The stimulus explicitly states the rule applies to "Everyone."',
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This stimulus is testing your conditional logic skills via a flaw question. Let's map the mechanics:</p>
<ul>
<li><strong>Rule 1:</strong> Practice Cello → Finger Dexterity</li>
<li><strong>Rule 2:</strong> Practice Cello → Technical Expertise</li>
<li><strong>Application:</strong> Julian has Finger Dexterity.</li>
<li><strong>Flawed Conclusion:</strong> Therefore, Julian practices the cello.</li>
</ul>
<p>The author is confusing a sufficient condition with a necessary condition. Practicing the cello guarantees you will have dexterity (it is sufficient). However, it is not the only way to get dexterity (it is not necessary). Julian could have gotten his dexterity from playing the piano, typing, or performing surgery. Satisfying a necessary condition does not mean you satisfy a sufficient condition.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. The author doesn't care about what is "most effective," only about what Julian specifically does.</p>
<p><strong>B)</strong> Incorrect. The argument never presumed that Julian has been practicing for a long time, it only says that Julian consistently practices the cello. Besides, this is not the flaw of the argument.</p>
<p><strong>C)</strong> Correct. Let's decode the LSAT-speak. The "phenomenon" is practicing the cello. Finger dexterity is "necessary" for this (if you practice cello, you must have dexterity). The author treats Julian's dexterity as "sufficient" to prove he practices the cello. Perfect match.</p>
<p><strong>D)</strong> Incorrect. There is no personal attack (ad hominem) in this stimulus.</p>
<p><strong>E)</strong> Incorrect. The stimulus explicitly states the rule applies to "Everyone."</p>`,
  },
  {
    sourceItemId: "mini-diag-q4",
    questionNumber: 4,
    targetTimeSeconds: 65,
    difficulty: 2,
    questionType: "Resolve the Paradox",
    stimulusText: `A local bookstore set up a large, front-window display of highly-rated electronic reading tablets, offering them at a steep discount. The manager expected this to cause a massive surge in tablet sales. Surprisingly, tablet sales remained completely flat for the month, yet the sales of physical, hardcover books located on the shelves immediately behind the tablet display skyrocketed.`,
    stemText:
      "Which one of the following, if true, most helps to resolve the apparent paradox?",
    choices: [
      {
        letter: "A",
        text: "Electronic reading tablets are generally more profitable for the bookstore than physical hardcover books.",
        explanation: "Profit margins do not explain consumer behavior on the sales floor.",
      },
      {
        letter: "B",
        text: "Customers who were drawn into the store by the discounted tablets realized upon testing them that they strongly preferred the tactile experience of physical books.",
        explanation:
          "The display successfully lured people in, but interacting with the tablets made them realize they wanted real books, explaining the flat tablet sales and the surge in physical book sales.",
      },
      {
        letter: "C",
        text: "The bookstore did not heavily advertise the tablet discount in local newspapers or online forums.",
        explanation:
          "This might explain the flat tablet sales, but it completely fails to explain the massive surge in physical book sales.",
      },
      {
        letter: "D",
        text: "Many customers who purchase physical hardcover books also own an electronic reading tablet.",
        explanation:
          "This doesn't explain the sudden shift in sales dynamics right in front of the display.",
      },
      {
        letter: "E",
        text: "The physical books located behind the display were primarily classic novels that rarely go on sale.",
        explanation:
          "While interesting, it doesn't structurally link the tablet display to the sudden spike in physical book sales.",
      },
    ],
    correctAnswer: "B",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>A paradox question asks you to reconcile two facts that seem to contradict each other.</p>
<ul>
<li><strong>Fact 1:</strong> The manager discounted tablets in a big display to boost tablet sales, but tablet sales stayed flat.</li>
<li><strong>Fact 2:</strong> Physical book sales on the shelves right behind the display skyrocketed.</li>
</ul>
<p>We need an answer that bridges this gap. It must explain why the display drove traffic, but that traffic exclusively bought physical books instead of the discounted tablets.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. Profit margins do not explain consumer behavior on the sales floor.</p>
<p><strong>B)</strong> Correct. This perfectly resolves the mystery. The display successfully lured people in (explaining the sudden activity), but interacting with the tablets made them realize they wanted real books (explaining the flat tablet sales and the surge in physical book sales).</p>
<p><strong>C)</strong> Incorrect. This might explain the flat tablet sales, but it completely fails to explain the massive surge in physical book sales.</p>
<p><strong>D)</strong> Incorrect. This doesn't explain the sudden shift in sales dynamics right in front of the display.</p>
<p><strong>E)</strong> Incorrect. While interesting, it doesn't structurally link the tablet display to the sudden spike in physical book sales.</p>`,
  },
  {
    sourceItemId: "mini-diag-q5",
    questionNumber: 5,
    targetTimeSeconds: 70,
    difficulty: 3,
    questionType: "Weaken",
    stimulusText: `Biologists observing wild mountain goats noted that herds living at elevations above 10,000 feet have significantly thicker coats than herds living in the lower valleys. The biologists hypothesized that the freezing temperatures at higher altitudes directly cause the goats' bodies to produce thicker coats over time.`,
    stemText:
      "Which one of the following, if true, most seriously weakens the biologists' hypothesis?",
    choices: [
      {
        letter: "A",
        text: "Goats living in the lower valleys often seek shelter in caves during the colder winter months.",
        explanation:
          "This is irrelevant to why the high-altitude goats have thicker coats.",
      },
      {
        letter: "B",
        text: "The diet of goats at high altitudes differs significantly from the diet of goats in the valleys.",
        explanation:
          "While diet could be a third variable, it requires you to make an extra assumption that diet affects coat thickness.",
      },
      {
        letter: "C",
        text: "Goats that are genetically predisposed to grow thicker coats sometimes naturally migrate to higher altitudes because they overheat easily in the lower valleys.",
        explanation:
          "This is a weakener by introducing the possibility of reverse causality (specifically, a selection bias). The cold didn't cause the thick coats. The thick coats caused the goats to seek out the cold.",
      },
      {
        letter: "D",
        text: "Some mountain goats at high elevations have thinner coats than the average goat in their herd.",
        explanation:
          'Pointing out a few outliers ("some") does not destroy a general biological trend.',
      },
      {
        letter: "E",
        text: "A goat's coat thickness is largely determined by its age rather than its environment.",
        explanation:
          "While it introduces an alternate cause (age), it fails to account for the clear environmental correlation established in the stimulus.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is another causal argument, but this time we need to weaken the hypothesis instead.</p>
<ul>
<li><strong>Premise:</strong> High-altitude goats (cold) have thick coats. Low-altitude goats (warm) have thinner coats.</li>
<li><strong>Conclusion/Hypothesis:</strong> The freezing temperatures cause the thicker coats to grow.</li>
</ul>
<p>How do you weaken a causal relationship? We could show that the cause happened without the effect, the effect happened without the cause, or introduce reverse causality/a third variable.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. This is irrelevant to why the high-altitude goats have thicker coats.</p>
<p><strong>B)</strong> Incorrect. While diet could be a third variable, it requires you to make an extra assumption that diet affects coat thickness. We want an answer that attacks the logic directly without needing our help.</p>
<p><strong>C)</strong> Correct. This is a weakener by introducing the possibility of Reverse Causality (specifically, a selection bias). The cold didn't cause the thick coats. The thick coats caused the goats to seek out the cold.</p>
<p><strong>D)</strong> Incorrect. Pointing out a few outliers ("some") does not destroy a general biological trend.</p>
<p><strong>E)</strong> Incorrect. This is a trap. While it introduces an alternate cause (age), it fails to account for the clear environmental correlation established in the stimulus. Answer C explains the correlation perfectly while destroying the author's specific causal direction.</p>`,
  },
  {
    sourceItemId: "mini-diag-q6",
    questionNumber: 6,
    targetTimeSeconds: 105,
    difficulty: 4,
    questionType: "Necessary Assumption",
    stimulusText: `A city's environmental initiative to reduce airborne particulate matter relies entirely on replacing its aging fleet of diesel municipal buses with fully electric buses. However, the electrical grid in the city is primarily powered by older coal-fired plants, which themselves emit large quantities of airborne particulate matter. Therefore, replacing the diesel buses with electric buses will not significantly reduce the overall airborne particulate matter generated within the city.`,
    stemText:
      "The argument is required to assume which one of the following?",
    choices: [
      {
        letter: "A",
        text: "The city does not plan to transition its electrical grid from coal-fired plants to renewable energy sources in the near future.",
        explanation:
          'What the city plans to do in the "near future" doesn\'t change the mathematical reality of the immediate switch being debated.',
      },
      {
        letter: "B",
        text: "Electric buses are less efficient to operate on a daily basis than the city's current aging fleet of diesel buses.",
        explanation:
          '"Efficiency of operation" (like maintenance or cost) is completely out of scope. We only care about pollution output.',
      },
      {
        letter: "C",
        text: "The amount of airborne particulate matter generated by the coal-fired plants to power an electric bus is not significantly less than the amount generated by the operation of a diesel bus.",
        explanation:
          "If the amount of pollution generated by coal to power an electric bus IS significantly less than the pollution from a diesel bus, then the switch would massively reduce pollution, and the author's conclusion is destroyed.",
      },
      {
        letter: "D",
        text: "Airborne particulate matter from coal-fired plants is significantly more hazardous to human health than the particulate matter from diesel exhaust.",
        explanation:
          "The stimulus is about the amount of particulate matter, not the relative toxicity or health hazards of that matter.",
      },
      {
        letter: "E",
        text: "The only significant source of airborne particulate matter in the city is the public transportation sector.",
        explanation:
          "The argument doesn't need public transit to be the only source of pollution, it just needs this specific switch to fail at reducing the city's overall levels.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This question type is Necessary Assumption, meaning it asks for a hidden premise that must be true for the argument to survive. If you negate the right answer, the argument instantly collapses. The author is making a prediction about a policy switch.</p>
<ul>
<li><strong>Premise:</strong> The city is swapping diesel buses for electric buses to reduce particulate matter.</li>
<li><strong>Premise:</strong> The electric buses are powered by coal plants, which also emit particulate matter.</li>
<li><strong>Conclusion:</strong> Therefore, the switch will not significantly reduce overall particulate matter.</li>
</ul>
<p>The Gap: The author is comparing two sources of pollution (diesel vs. coal) and concluding things won't get better. But what if it takes a massive amount of diesel to run a bus, but only a tiny bit of coal to charge an electric one? The author is taking for granted that the coal emissions aren't drastically lower than the diesel emissions.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. What the city plans to do in the "near future" doesn't change the mathematical reality of the immediate switch being debated.</p>
<p><strong>B)</strong> Incorrect. "Efficiency of operation" (like maintenance or cost) is completely out of scope. We only care about pollution output.</p>
<p><strong>C)</strong> Correct. Let's apply the Negation Test. What if the amount of pollution generated by coal to power an electric bus IS significantly less than the pollution from a diesel bus? If that is true, then the switch would massively reduce pollution, and the author's conclusion is destroyed. This is the exact load-bearing assumption the argument rests on.</p>
<p><strong>D)</strong> Incorrect. The stimulus is about the amount of particulate matter, not the relative toxicity or health hazards of that matter.</p>
<p><strong>E)</strong> Incorrect. The argument doesn't need public transit to be the only source of pollution, it just needs this specific switch to fail at reducing the city's overall levels.</p>`,
  },
  {
    sourceItemId: "mini-diag-q7",
    questionNumber: 7,
    targetTimeSeconds: 105,
    difficulty: 5,
    questionType: "Parallel Flaw",
    stimulusText: `The newly formed symphony orchestra is composed entirely of world-class virtuosos who have won major international solo competitions. Because individual excellence dictates group performance, the orchestra will undoubtedly produce the most cohesive and harmonious ensemble sound of any musical group in the country.`,
    stemText:
      "Which one of the following arguments exhibits a flawed pattern of reasoning most strictly parallel to that of the argument above?",
    choices: [
      {
        letter: "A",
        text: "Every brick in this building is structurally sound and highly durable. Therefore, the building itself will be able to withstand severe seismic activity without collapsing.",
        explanation:
          "Every brick (the parts) is strong. Therefore, the building (the whole) won't collapse. This is a flawless 1-to-1 structural match for the part-to-whole flaw.",
      },
      {
        letter: "B",
        text: "The university's debate team is the most successful in the nation. Therefore, the captain of the team must be the most skilled individual debater in the nation.",
        explanation:
          "This is a Whole-to-Part flaw, which is the exact reverse of our stimulus.",
      },
      {
        letter: "C",
        text: "If a recipe calls for the freshest ingredients, the resulting dish will be delicious. This dish is delicious, so it must have been made with the freshest ingredients.",
        explanation:
          'This is a sufficiency/necessity conditional flaw (affirming the consequent). It establishes "Fresh → Delicious," then says "Delicious → Fresh."',
      },
      {
        letter: "D",
        text: "All successful tech startups operate in highly competitive markets. Since our new software company operates in a highly competitive market, we will certainly be successful.",
        explanation:
          'This is also a sufficiency-necessity conditional flaw. "Successful → Competitive." "We are Competitive → Therefore, Successful."',
      },
      {
        letter: "E",
        text: "A championship basketball team consists of players who all boast the highest individual scoring averages in the league. Therefore, the team will easily generate the highest overall revenue in the league.",
        explanation:
          'This shifts the terms from "highest scoring" (a basketball metric) to "highest revenue" (a financial metric).',
      },
    ],
    correctAnswer: "A",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>This is a parallel flaw question. This type requires you to abstract the structural logical error in the stimulus and find an answer choice that commits the exact same error. The stimulus commits a classic Part-to-Whole flaw.</p>
<ul>
<li><strong>Premise:</strong> Every individual player (the parts) in the orchestra is a world-class virtuoso.</li>
<li><strong>Conclusion:</strong> The orchestra (the whole) will produce the most cohesive and harmonious sound.</li>
</ul>
<p>The Flaw: Just because the pieces are great doesn't mean the assembled machine is great. Put fifty world-class soloists in a room, and you might just get fifty massive egos clashing. The author assumes the characteristics of the parts automatically transfer to the whole.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Correct. Every brick (the parts) is strong. Therefore, the building (the whole) won't collapse. This is a flawless 1-to-1 structural match. A building made of strong bricks can still fall down if the architect used a terrible design.</p>
<p><strong>B)</strong> Incorrect. This is a Whole-to-Part flaw, which is the exact reverse of our stimulus. It assumes because the team (whole) is good, the captain (part) must be good.</p>
<p><strong>C)</strong> Incorrect. This is a sufficiency/necessity conditional flaw (affirming the consequent). It establishes "Fresh → Delicious," then says "Delicious → Fresh." This does not match the flaw in the stimulus.</p>
<p><strong>D)</strong> Incorrect. This is also a sufficiency-necessity conditional flaw. "Successful → Competitive." "We are Competitive → Therefore, Successful." This isn't the flaw we are looking for.</p>
<p><strong>E)</strong> Incorrect. This shifts the terms. It goes from "highest scoring" (a basketball metric) to "highest revenue" (a financial metric). Not what we're looking for as a Part-to-Whole flaw.</p>`,
  },
  {
    sourceItemId: "mini-diag-q8",
    questionNumber: 8,
    targetTimeSeconds: 90,
    difficulty: 4,
    questionType: "Most Strongly Supported",
    stimulusText: `Most successful venture capitalists possess an unusually high tolerance for financial risk. Furthermore, economic data demonstrates that anyone with an unusually high tolerance for financial risk is highly likely to experience at least one catastrophic market failure in their lifetime. However, corporate records indicate that very few successful venture capitalists ever declare personal bankruptcy.`,
    stemText:
      "Which one of the following statements is most strongly supported by the information above?",
    choices: [
      {
        letter: "A",
        text: "A high tolerance for financial risk is the single most important trait for a successful venture capitalist.",
        explanation:
          '"Single most important" is way too extreme. The stimulus just says it\'s something most of them possess.',
      },
      {
        letter: "B",
        text: "Most individuals who experience a catastrophic market failure are not successful venture capitalists.",
        explanation:
          'We know about successful VCs, but we know nothing about the broader group of "most individuals" who experience failures.',
      },
      {
        letter: "C",
        text: "Experiencing a catastrophic market failure does not inevitably lead to declaring personal bankruptcy.",
        explanation:
          "You can experience catastrophic failure without ending up in personal bankruptcy, as seen with successful venture capitalists.",
      },
      {
        letter: "D",
        text: "Very few people who declare personal bankruptcy possess an unusually high tolerance for financial risk.",
        explanation:
          "The stimulus tells us nothing about the risk tolerance of people who do declare bankruptcy.",
      },
      {
        letter: "E",
        text: "Venture capitalists who do not experience a catastrophic market failure are generally unsuccessful.",
        explanation:
          "The stimulus never implies that catastrophic market failures are somehow correlated to not being successful.",
      },
    ],
    correctAnswer: "C",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Most Strongly Supported. This type requires you to synthesize the given facts and deduce what is highly likely to be true based only on those facts. No outside assumptions allowed. Connect the facts.</p>
<ul>
<li><strong>Fact 1:</strong> Most successful VCs = High risk tolerance.</li>
<li><strong>Fact 2:</strong> High risk tolerance = Highly likely to have a catastrophic market failure.</li>
<li><strong>Implication 1:</strong> Most successful VCs are highly likely to have a catastrophic market failure.</li>
<li><strong>Fact 3:</strong> Very few successful VCs declare personal bankruptcy.</li>
</ul>
<p>The Final Implication: If successful VCs are having these catastrophic market failures (Fact 1 + 2), but they aren't going bankrupt (Fact 3), then a catastrophic market failure doesn't automatically mean you go bankrupt.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. "Single most important" is way too extreme. The stimulus just says it's something most of them possess.</p>
<p><strong>B)</strong> Incorrect. We know about successful VCs, but we know nothing about the broader group of "most individuals" who experience failures.</p>
<p><strong>C)</strong> Correct. This perfectly matches our final synthesis. You can experience catastrophic failure without ending up in personal bankruptcy, as seen with successful venture capitalists.</p>
<p><strong>D)</strong> Incorrect. The stimulus tells us nothing about the risk tolerance of people who do declare bankruptcy.</p>
<p><strong>E)</strong> Incorrect. The stimulus never implies that catastrophic market failures are somehow correlated to not being successful. The stimulus only talks about successful venture capitalists to begin with, so we cannot infer anything about those who are unsuccessful.</p>`,
  },
  {
    sourceItemId: "mini-diag-q9",
    questionNumber: 9,
    targetTimeSeconds: 110,
    difficulty: 5,
    questionType: "Sufficient Assumption",
    stimulusText: `Architect: No one who lacks a comprehensive understanding of local zoning laws can successfully navigate a commercial high-rise through the permit process. But only someone who has personally financed a major real estate venture has the motivation to acquire a comprehensive understanding of those zoning laws. Therefore, independent urban planners cannot successfully navigate a commercial high-rise through the permit process.`,
    stemText:
      "Which one of the following, if assumed, allows the conclusion to be properly drawn?",
    choices: [
      {
        letter: "A",
        text: "Independent urban planners have never personally financed a major real estate venture, and no one acquires a comprehensive understanding of local zoning laws without the motivation to do so.",
        explanation:
          'The first half connects independent planners to a lack of personal financing; the second half translates to "/Motivation to Acquire → /Comprehensive Understanding," closing both gaps in the chain.',
      },
      {
        letter: "B",
        text: "Anyone who has personally financed a major real estate venture possesses a comprehensive understanding of local zoning laws, and independent urban planners lack this motivation.",
        explanation:
          "The first half flips the arrow of Premise 2. Stating that planners lack motivation doesn't help unless you also bridge the gap between lacking motivation and lacking understanding.",
      },
      {
        letter: "C",
        text: "Only independent urban planners who have personally financed a major real estate venture have the motivation to successfully navigate the permit process.",
        explanation:
          "This creates a new rule about who gets to have motivation but fails to tell us whether independent urban planners as a whole actually fail to meet this requirement.",
      },
      {
        letter: "D",
        text: "Independent urban planners do not have the motivation to acquire a comprehensive understanding of local zoning laws because they do not stand to profit directly from the real estate venture.",
        explanation:
          "While it states that planners lack motivation, it completely fails to address the gap between lacking motivation and lacking the understanding.",
      },
      {
        letter: "E",
        text: "A comprehensive understanding of local zoning laws guarantees that an independent urban planner will successfully navigate a commercial high-rise through the permit process.",
        explanation:
          "This commits a reversing the arrow of Premise 1 and does nothing to prove the conclusion that the independent planners cannot navigate.",
      },
    ],
    correctAnswer: "A",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Sufficient Assumption. This type asks for a premise that, if added, proves the conclusion with 100% mathematical certainty. It completely bridges the gap. This is a hard question containing various conditional rules. First, let's translate the stimulus into diagrams:</p>
<ul>
<li><strong>Premise 1:</strong> Successfully Navigate → Comprehensive Understanding</li>
<li><strong>Premise 2:</strong> Motivation to Acquire → Personally Financed</li>
<li><strong>Conclusion:</strong> Independent Urban Planner → /Successfully Navigate</li>
</ul>
<p>Exposing the Missing Links (The Gap): To prove the conclusion (that Planners CANNOT navigate), we must trigger the contrapositive of Premise 1. That means we must prove that Planners lack understanding. But look at the evidence provided. The author gives us Premise 2, which is about having the motivation to acquire an understanding. Having the motivation to do something and actually having it are two entirely different concepts on the LSAT.</p>
<p>Here is the chain we need to build, with the missing gaps highlighted: Independent Urban Planner [GAP 1] → /Personally Financed → /Motivation to Acquire [GAP 2] → /Comprehensive Understanding → /Successfully Navigate. To solve this question, the correct answer must fill both gaps simultaneously.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Correct. This answer perfectly fills both gaps to complete our chain. First half: "planners have never personally financed..." fills GAP 1. According to Premise 2, lacking financing means they lack motivation. Second half: "no one acquires a comprehensive understanding... without the motivation..." translates to: /Motivation to Acquire → /Comprehensive Understanding. This fills GAP 2. The chain is now closed and the conclusion is proven.</p>
<p><strong>B)</strong> Incorrect. The first half flips the arrow of Premise 2. Premise 2 said financing is necessary for motivation; it did not say financing guarantees you have the understanding. Furthermore, stating that planners lack motivation doesn't help unless you also bridge the gap between lacking motivation and lacking understanding (Gap 2), which this answer fails to do.</p>
<p><strong>C)</strong> Incorrect. This choice just creates a new rule about who gets to have motivation. It completely fails to tell us whether independent urban planners as a whole actually fail to meet this requirement or not.</p>
<p><strong>D)</strong> Incorrect. While it states that planners lack motivation, it wastes the rest of the sentence explaining why they lack it. The reason something happens is irrelevant. This answer completely fails to address GAP 2.</p>
<p><strong>E)</strong> Incorrect. This commits a reversing the arrow of Premise 1. Premise 1 states that an understanding is necessary to navigate (Navigate → Understanding). This answer flips it, claiming the understanding is sufficient to navigate (Understanding → Navigate). This does nothing to prove the conclusion that the independent planners cannot navigate.</p>`,
  },
  {
    sourceItemId: "mini-diag-q10",
    questionNumber: 10,
    targetTimeSeconds: 80,
    difficulty: 3,
    questionType: "Principle Application",
    stimulusText: `It constitutes a breach of professional integrity for academic peer reviewers to use their knowledge of unpublished manuscript data to directly benefit their own laboratories if that data has not yet been made available to the broader scientific community.`,
    stemText:
      "Which one of the following actions would constitute a breach of professional integrity according to the principle stated above?",
    choices: [
      {
        letter: "A",
        text: "A laboratory whose former director is now a senior peer reviewer was one of several labs applying for a major research grant; the names of the competing labs were not disclosed to the broader scientific community.",
        explanation:
          "Fails the action. The issue here is about undisclosed competitors, not using unpublished data to benefit a lab.",
      },
      {
        letter: "B",
        text: "A retired peer reviewer now runs a private research facility. He uses his ongoing contacts with journal editors to help his facility secure highly favorable publication dates.",
        explanation:
          "Fails the actor (retired) and the action (using contacts, not unpublished data).",
      },
      {
        letter: "C",
        text: "After a groundbreaking paper was officially published, a peer reviewer utilized the newly public methodology to accelerate her own laboratory's ongoing experiments by 20 percent.",
        explanation:
          "Fails the condition. The reviewer waited until after the paper was officially published and public.",
      },
      {
        letter: "D",
        text: "A peer reviewer, one of the few people who had read a submitted manuscript detailing a highly efficient synthetic pathway, restructured his own lab's workflow to utilize that pathway just before the manuscript was published.",
        explanation:
          "Hits every trigger flawlessly. The actor (peer reviewer) uses knowledge (synthetic pathway) to benefit their lab (restructured workflow) just before it was published (not yet public).",
      },
      {
        letter: "E",
        text: "A peer reviewer working for a university research board halted her team's redundant experiments just after she publicly announced that a rival lab had already successfully proven the hypothesis.",
        explanation:
          "Fails the condition. She acted after making a public announcement, meaning the information was no longer secret.",
      },
    ],
    correctAnswer: "D",
    explanationHtml: `<h3>Stimulus Analysis</h3>
<p>Question Type: Principle Application. This type gives you a rigid rule and asks you to find a scenario that perfectly triggers every single condition of that rule.</p>
<p>The Rule: To violate the principle, a scenario must hit all of these triggers:</p>
<ul>
<li><strong>Actor:</strong> Must be an academic peer reviewer.</li>
<li><strong>Action:</strong> Uses knowledge of unpublished data.</li>
<li><strong>Outcome:</strong> Directly benefits their own lab.</li>
<li><strong>Condition:</strong> The data is not yet public.</li>
</ul>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. Fails the action. The issue here is about undisclosed competitors, not using unpublished data to benefit a lab.</p>
<p><strong>B)</strong> Incorrect. Fails the actor (retired) and the action (using contacts, not unpublished data).</p>
<p><strong>C)</strong> Incorrect. Fails the condition. The reviewer waited until after the paper was officially published and public.</p>
<p><strong>D)</strong> Correct. Hits every trigger flawlessly. The actor (peer reviewer) uses knowledge (synthetic pathway) to benefit their lab (restructured workflow) just before it was published (not yet public).</p>
<p><strong>E)</strong> Incorrect. Fails the condition. She acted after making a public announcement, meaning the information was no longer secret.</p>`,
  },
]
