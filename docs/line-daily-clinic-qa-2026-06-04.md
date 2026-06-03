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
