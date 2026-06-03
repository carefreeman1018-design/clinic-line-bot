# LINE daily clinic QA - 2026-06-04

Goal: test ordinary first-visit clinic operations in the real LINE test chat.

## Round 1 - Basic admin and clinic hours

| # | Patient question | LINE reply summary | Result | Notes |
|---|---|---|---|---|
| 1 | 我今天下午第一次去，下午有門診嗎？可以現場掛號嗎？請講重點。 | 今天週四午診是手術時段，不是一般門診；請以 LINE VOOM/線上掛號/電話確認。 | Fail | Correct schedule, but missed walk-in/onsite registration. |
| 2 | 那今天晚上有一般門診嗎？我可以直接到現場掛號嗎？不要貼連結。 | 今天週四晚診是陳偉傑醫師門診；請以 LINE VOOM/線上掛號/電話確認。 | Fail | Correct schedule, still missed onsite registration. |
| 3 | 我從行天宮站過去，診所在幾樓？電話多少？我在外面，請短一點。 | 地址是台北市中山區松江路 276 號 3 樓；電話 02-2511-9488。 | Partial | Short and correct, but missed the requested 行天宮 route. |
| 4 | 如果我開車去，附近有停車場嗎？不要太長。 | Gives two nearby parking lots. | Pass | Good enough. |
| 5 | 你們有 HPV 疫苗和匿名篩檢嗎？可以今天現場做嗎？費用能先知道嗎？請講重點。 | Only answered HPV vaccine and cost/schedule uncertainty. | Fail | Missed anonymous screening and same-day onsite availability. |
| 6 | 那匿名篩檢呢？今天可以現場做嗎？費用能先知道嗎？ | Repeated HPV vaccine answer. | Fail | Follow-up context incorrectly stuck on HPV. |

### Retest after d26822d

| # | Patient question | LINE reply summary | Result | Notes |
|---|---|---|---|---|
| 1 | 我今天下午第一次去，下午有門診嗎？可以現場掛號嗎？請講重點。 | Says Thu afternoon is surgery, lists Thu general clinic alternatives, and adds onsite registration confirmation caveat. | Pass | Addresses both clinic hours and walk-in uncertainty. |
| 2 | 那今天晚上有一般門診嗎？我可以直接到現場掛號嗎？不要貼連結。 | Says Thu evening is Chen clinic and adds onsite registration confirmation caveat. | Pass | No link pasted. |
| 3 | 我從行天宮站過去，診所在幾樓？電話多少？我在外面，請短一點。 | Gives address, Xingtiangong Exit 4 route, 3F, and phone. | Pass | Short enough for someone already outside. |
| 5 | 你們有 HPV 疫苗和匿名篩檢嗎？可以今天現場做嗎？費用能先知道嗎？請講重點。 | Answers HPV vaccine and anonymous screening together; price, stock, same-day quota and onsite availability require phone/onsite confirmation. | Pass | No longer drops anonymous screening. |
| 6 | 那匿名篩檢呢？今天可以現場做嗎？費用能先知道嗎？ | Answers anonymous screening directly; fees and same-day onsite availability require confirmation. | Pass | No longer stuck on HPV follow-up context. |

## Round 2 - Doctor info and follow-up context

| # | Patient question | LINE reply summary | Result | Notes |
|---|---|---|---|---|
| 1 | 院長是誰？他今天有看診嗎？不要貼連結，講重點。 | Replied only with today's fixed schedule: morning Luo, afternoon surgery, evening Chen. | Fail | Missed director identity; schedule intent overrode doctor info. |
| 2 | 那他主要看什麼？ | Replied with Chen Wei-Jie specialties. | Fail | Follow-up context landed on Chen from the bad schedule answer, not the director. |
| 3 | 陳偉傑醫師是誰？他今天晚上有診嗎？ | Replied only that tonight is Chen clinic and to confirm via LINE VOOM/online/phone. | Fail | Missed "who is Chen"; same-message doctor identity plus schedule issue. |
| 4 | 他跟羅詩修醫師差在哪？我不知道要掛誰。 | Compared Chen and Luo specialties and said to choose based on issue and available time. | Pass | Good enough; does not force one doctor. |
| 5 | 羅醫師明天早上有診嗎？那陳醫師呢？請短一點。 | Replied only that tomorrow Friday morning is Chen clinic. | Fail | Missed Luo part and two-doctor comparison; likely multi-doctor schedule parsing issue. |
| 6 | 如果只是一般泌尿問題，我要掛哪位？不要推薦唯一一個。 | Said either doctor is okay for general urology; choose by schedule, unless specific conditions. | Pass | Avoids recommending a single doctor. |

### Retest after c2bbe13

| # | Patient question | LINE reply summary | Result | Notes |
|---|---|---|---|---|
| 1 | 院長是誰？他今天有看診嗎？不要貼連結，講重點。 | Says Chen Wei-Jie is clinic director, gives concise specialties, and says today Thu evening is Chen clinic. | Pass | Doctor identity no longer lost to schedule routing. |
| 2 | 那他主要看什麼？ | Answers Chen Wei-Jie main specialties in a short sentence. | Pass | Pronoun follow-up now stays on director/Chen context. |
| 3 | 陳偉傑醫師是誰？他今天晚上有診嗎？ | Says Chen Wei-Jie is clinic director, gives concise specialties, and confirms tonight Thu evening clinic. | Pass | Same-message doctor identity plus schedule works. |
| 5 | 羅醫師明天早上有診嗎？那陳醫師呢？請短一點。 | Says tomorrow Fri morning Luo has no clinic and Chen has clinic, with confirmation reminder. | Pass | Two named doctors are answered separately. |

## Round 3 - Appointment, access, and service mixed questions

| # | Patient question | LINE reply summary | Result | Notes |
|---|---|---|---|---|
| 1 | 我已經線上掛號了，但想改今天晚上，可以直接改嗎？不要貼連結，請講重點。 | Only answered Thu evening fixed clinic and confirmation channels. | Fail | Missed whether/how an existing online registration can be changed. |
| 2 | 我第一次去，從行天宮站到診所要怎麼走？到現場要先報到還是先掛號？我在路上，短一點。 | Gave Xingtiangong route to 3F. | Partial | Good route, but missed arrival check-in/registration flow. |
| 3 | 我想做結紮諮詢，今天晚上可以直接去問嗎？費用可以先知道嗎？不要講太長。 | Gave today consult clinics and same-day arrangement caveat. | Partial | Missed the fee question. |
| 4 | 攝護腺肥大你們有看嗎？我明天下午可以掛嗎？要帶什麼？ | Answered that prostate enlargement evaluation/treatment is available. | Fail | Missed tomorrow afternoon clinic and what to bring. |
| 5 | 匿名篩檢可以刷卡嗎？要帶健保卡或身分證嗎？請不要保證。 | Said anonymous screening is available and flow/fees should be confirmed. | Partial | Too generic; missed card payment and document handling. |
| 6 | 我現在在診所外面，想問 HPV 疫苗、匿名篩檢和掛號，下一步先做什麼？ | Answered HPV vaccine and anonymous screening availability/confirmation. | Partial | Missed immediate onsite next step and registration flow. |

## Round 3 Retest - After mixed admin fixes

| # | Patient question | LINE reply summary | Result | Notes |
|---|---|---|---|---|
| 1 | 我已經線上掛號了，但想改今天晚上，可以直接改嗎？不要貼連結，請講重點。 | Says LINE cannot guarantee the change; call or ask onsite counter to check whether evening change and quota are possible. | Pass | No link pasted. |
| 2 | 我第一次去，從行天宮站到診所要怎麼走？到現場要先報到還是先掛號？我在路上，短一點。 | Gives Exit 4 route and tells first-time patient to report to counter; counter confirms registration flow if not registered or data is incomplete. | Pass | Addresses route plus arrival flow. |
| 3 | 我想做結紮諮詢，今天晚上可以直接去問嗎？費用可以先知道嗎？不要講太長。 | Gives today consult clinics, adds that fee and same-day arrangement need phone/onsite confirmation and cannot be guaranteed or quoted online. | Pass | Fee caveat now present. |
| 4 | 攝護腺肥大你們有看嗎？我明天下午可以掛嗎？要帶什麼？ | Says clinic evaluates prostate/voiding issues; tomorrow Fri afternoon is Luo clinic; bring health card, ID, recent reports/PSA/ultrasound/medication data if available. | Pass | Service, schedule, and prep all included. |
| 5 | 匿名篩檢可以刷卡嗎？要帶健保卡或身分證嗎？請不要保證。 | Says anonymous screening flow can be asked onsite; payment/card and document needs depend on item and onsite process; does not guarantee. | Pass | Conservative admin answer. |
| 6 | 我現在在診所外面，想問 HPV 疫苗、匿名篩檢和掛號，下一步先做什麼？ | Tells patient to go to counter/nursing station and say they want HPV vaccine, anonymous screening, and registration; quota, stock, flow and fees need confirmation. | Pass | Immediate next step works. |

## Round 4 - Natural phrasing and multi-turn context

| # | Patient question | LINE reply summary | Result | Notes |
|---|---|---|---|---|
| 1 | 先換個問題。我朋友說院長比較會看，我只是頻尿，今天晚上一定要掛他嗎？不要推薦唯一醫師。 | Replied with generic frequency/urinary urgency evaluation and red-flag guidance. | Partial | Avoided one-doctor recommendation, but missed tonight/director context and whether Chen is required. |
| 2 | 那羅醫師明天呢？ | Listed full Friday fixed schedule. | Partial | Shows Luo has Friday afternoon clinic, but does not directly answer "Luo tomorrow" in a concise follow-up style. |
| 3 | 他主要看什麼？ | Answered Chen Wei-Jie specialties. | Fail | Pronoun should resolve to Luo after #2, but landed on Chen. |
| 4 | 我在外面，不想看長文，想問匿名篩檢跟 HPV，要先抽號嗎？ | Replied with generic anonymous screening service, flow/fee confirmation, and phone. | Fail | Missed onsite short next step and queue/registration wording. |
| 5 | 那可以直接刷卡嗎？ | Says payment method is not clearly public, cannot guarantee card, confirm onsite or by phone. | Pass | Follow-up payment context is conservative enough. |
| 6 | 如果我不要貼連結，只想知道明天下午誰看診？ | Says tomorrow Fri afternoon is Luo clinic and no URL, with confirmation reminder. | Pass | Short schedule answer; no link pasted. |
