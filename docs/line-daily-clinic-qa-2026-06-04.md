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
