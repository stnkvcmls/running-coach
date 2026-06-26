window.BENCHMARK_DATA = {
  "lastUpdate": 1782517477894,
  "repoUrl": "https://github.com/stnkvcmls/running-coach",
  "entries": {
    "API Endpoint Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "2fcc37f7af5b0fa3b0474ca591d0caeb51627820",
          "message": "Merge pull request #65 from stnkvcmls/claude/performance-test-marathon-data-vkjp6j\n\nAdd API performance test suite with committed marathon dataset",
          "timestamp": "2026-06-20T13:04:07+02:00",
          "tree_id": "4b01056668db6e204520dbb780afbf95d5fe9a72",
          "url": "https://github.com/stnkvcmls/running-coach/commit/2fcc37f7af5b0fa3b0474ca591d0caeb51627820"
        },
        "date": 1781953499987,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 416.4588738397821,
            "unit": "iter/sec",
            "range": "stddev: 0.00016362402329552658",
            "extra": "mean: 2.4011974838713965 msec\nrounds: 62"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 30.429349249934376,
            "unit": "iter/sec",
            "range": "stddev: 0.02199833116200076",
            "extra": "mean: 32.86300971428617 msec\nrounds: 21"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 31.605075354255668,
            "unit": "iter/sec",
            "range": "stddev: 0.021780146614365187",
            "extra": "mean: 31.640487763157587 msec\nrounds: 38"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 99.87214068932894,
            "unit": "iter/sec",
            "range": "stddev: 0.0002487415459083881",
            "extra": "mean: 10.012802299999635 msec\nrounds: 10"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 166.15750667425118,
            "unit": "iter/sec",
            "range": "stddev: 0.00011543622448849085",
            "extra": "mean: 6.0183859280007255 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 198.4075471413455,
            "unit": "iter/sec",
            "range": "stddev: 0.00008219601499493972",
            "extra": "mean: 5.0401308539316805 msec\nrounds: 89"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 200.83521446340106,
            "unit": "iter/sec",
            "range": "stddev: 0.00011460346685695025",
            "extra": "mean: 4.9792064736845925 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 280.69295951686075,
            "unit": "iter/sec",
            "range": "stddev: 0.00010984582520361204",
            "extra": "mean: 3.562611622754049 msec\nrounds: 167"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 159.66867828682896,
            "unit": "iter/sec",
            "range": "stddev: 0.008731812200662005",
            "extra": "mean: 6.262969110344855 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 246.580468750932,
            "unit": "iter/sec",
            "range": "stddev: 0.00011949736381327776",
            "extra": "mean: 4.055471242574724 msec\nrounds: 202"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 313.2840292064762,
            "unit": "iter/sec",
            "range": "stddev: 0.00011654470747885501",
            "extra": "mean: 3.191991633065118 msec\nrounds: 248"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 161.8422623788394,
            "unit": "iter/sec",
            "range": "stddev: 0.00011187114805711262",
            "extra": "mean: 6.178855790208901 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 252.4575446685268,
            "unit": "iter/sec",
            "range": "stddev: 0.00013822952836823563",
            "extra": "mean: 3.961062052286795 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 239.54191338642187,
            "unit": "iter/sec",
            "range": "stddev: 0.0076304256070021835",
            "extra": "mean: 4.174634767932365 msec\nrounds: 237"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 293.61369532058285,
            "unit": "iter/sec",
            "range": "stddev: 0.00011415450800453613",
            "extra": "mean: 3.405835681159721 msec\nrounds: 276"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 252.8503476139838,
            "unit": "iter/sec",
            "range": "stddev: 0.00011541779453730331",
            "extra": "mean: 3.95490854347829 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 16.363154457580674,
            "unit": "iter/sec",
            "range": "stddev: 0.0003300156930584791",
            "extra": "mean: 61.112910875000814 msec\nrounds: 16"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 221.62133574170218,
            "unit": "iter/sec",
            "range": "stddev: 0.00026847695813617963",
            "extra": "mean: 4.512200942446677 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.443004528948148,
            "unit": "iter/sec",
            "range": "stddev: 0.004499551520540198",
            "extra": "mean: 105.89849839999914 msec\nrounds: 10"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 22.899854587664766,
            "unit": "iter/sec",
            "range": "stddev: 0.026906465831677565",
            "extra": "mean: 43.66839955999808 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 37.58763574053277,
            "unit": "iter/sec",
            "range": "stddev: 0.020002050562384906",
            "extra": "mean: 26.604493214284457 msec\nrounds: 42"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 132.73487213790636,
            "unit": "iter/sec",
            "range": "stddev: 0.000133678926436595",
            "extra": "mean: 7.533815220472273 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 229.62937599462185,
            "unit": "iter/sec",
            "range": "stddev: 0.00012043173609481531",
            "extra": "mean: 4.354843519774321 msec\nrounds: 177"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 226.22816262308191,
            "unit": "iter/sec",
            "range": "stddev: 0.00015602675387834617",
            "extra": "mean: 4.42031614634159 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 202.31032525804304,
            "unit": "iter/sec",
            "range": "stddev: 0.00011301610916117923",
            "extra": "mean: 4.9429014496641175 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 16.021440601028488,
            "unit": "iter/sec",
            "range": "stddev: 0.00031049599565960325",
            "extra": "mean: 62.416359733331696 msec\nrounds: 15"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 190.42331266742028,
            "unit": "iter/sec",
            "range": "stddev: 0.00012591830127780748",
            "extra": "mean: 5.251457849315585 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 242.5490612183862,
            "unit": "iter/sec",
            "range": "stddev: 0.00011991842283254021",
            "extra": "mean: 4.122877223175976 msec\nrounds: 233"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 202.87374137627515,
            "unit": "iter/sec",
            "range": "stddev: 0.00014573832273906412",
            "extra": "mean: 4.929174141592204 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 220.82970320535483,
            "unit": "iter/sec",
            "range": "stddev: 0.009370030738220729",
            "extra": "mean: 4.528376325670628 msec\nrounds: 261"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b8f5a726a38056fe50a80077881e7f57bf5fda2d",
          "message": "Merge pull request #66 from stnkvcmls/claude/funny-pascal-zg57vy\n\nP3-1: Cache training-load series and threshold estimates",
          "timestamp": "2026-06-20T14:51:04+02:00",
          "tree_id": "94f50edabef2ec7bd6c09a0c2a4dd86d16f014ec",
          "url": "https://github.com/stnkvcmls/running-coach/commit/b8f5a726a38056fe50a80077881e7f57bf5fda2d"
        },
        "date": 1781959916185,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 428.6892183424023,
            "unit": "iter/sec",
            "range": "stddev: 0.00020413606122867686",
            "extra": "mean: 2.3326922096773637 msec\nrounds: 62"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 97.18684600261942,
            "unit": "iter/sec",
            "range": "stddev: 0.0003229665535903801",
            "extra": "mean: 10.289458307691635 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 120.18475983640289,
            "unit": "iter/sec",
            "range": "stddev: 0.00017558624223603723",
            "extra": "mean: 8.320522513513474 msec\nrounds: 111"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 93.48367297389854,
            "unit": "iter/sec",
            "range": "stddev: 0.009009860646686449",
            "extra": "mean: 10.697055091953958 msec\nrounds: 87"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 167.9069799808436,
            "unit": "iter/sec",
            "range": "stddev: 0.00011176353113236854",
            "extra": "mean: 5.955678555555518 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 201.35418901167338,
            "unit": "iter/sec",
            "range": "stddev: 0.00009372182095947677",
            "extra": "mean: 4.966372961538067 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 205.52258545271727,
            "unit": "iter/sec",
            "range": "stddev: 0.00010020782764113343",
            "extra": "mean: 4.865645290502932 msec\nrounds: 179"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 243.10737941037317,
            "unit": "iter/sec",
            "range": "stddev: 0.006928711543971224",
            "extra": "mean: 4.113408660919204 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 183.9139759277193,
            "unit": "iter/sec",
            "range": "stddev: 0.00008110090922505388",
            "extra": "mean: 5.437324678321421 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 249.0577140631086,
            "unit": "iter/sec",
            "range": "stddev: 0.0001202886589023945",
            "extra": "mean: 4.015133615763496 msec\nrounds: 203"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 310.822296752636,
            "unit": "iter/sec",
            "range": "stddev: 0.00016730588563195845",
            "extra": "mean: 3.2172724107879467 msec\nrounds: 241"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 147.0588445632187,
            "unit": "iter/sec",
            "range": "stddev: 0.008124641279622319",
            "extra": "mean: 6.799999027396905 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 232.63346869162282,
            "unit": "iter/sec",
            "range": "stddev: 0.00013932630696400538",
            "extra": "mean: 4.298607614906833 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 283.3500444431483,
            "unit": "iter/sec",
            "range": "stddev: 0.00011328920092362461",
            "extra": "mean: 3.529203610909054 msec\nrounds: 275"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 262.6928604874109,
            "unit": "iter/sec",
            "range": "stddev: 0.006187242779104349",
            "extra": "mean: 3.806726982014509 msec\nrounds: 278"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 250.2950446033084,
            "unit": "iter/sec",
            "range": "stddev: 0.00012040506992027378",
            "extra": "mean: 3.995284851064054 msec\nrounds: 188"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 214.99562985548638,
            "unit": "iter/sec",
            "range": "stddev: 0.00023764387604813993",
            "extra": "mean: 4.651257333333565 msec\nrounds: 15"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 221.42569454207546,
            "unit": "iter/sec",
            "range": "stddev: 0.00019603135134588906",
            "extra": "mean: 4.516187708332915 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.050680625664066,
            "unit": "iter/sec",
            "range": "stddev: 0.00552471080621127",
            "extra": "mean: 110.4889280000009 msec\nrounds: 10"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 23.629776921973374,
            "unit": "iter/sec",
            "range": "stddev: 0.02074467326299772",
            "extra": "mean: 42.31948542307643 msec\nrounds: 26"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 39.58678702673957,
            "unit": "iter/sec",
            "range": "stddev: 0.0012618873863513328",
            "extra": "mean: 25.260953846154095 msec\nrounds: 39"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 120.95560219319,
            "unit": "iter/sec",
            "range": "stddev: 0.010238572298808176",
            "extra": "mean: 8.26749635294116 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 228.88750724747254,
            "unit": "iter/sec",
            "range": "stddev: 0.00011735448374210436",
            "extra": "mean: 4.368958411167468 msec\nrounds: 197"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 226.6036388284313,
            "unit": "iter/sec",
            "range": "stddev: 0.00010654875474195998",
            "extra": "mean: 4.4129917999998725 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 201.892842895109,
            "unit": "iter/sec",
            "range": "stddev: 0.00010930941428697368",
            "extra": "mean: 4.953122585526907 msec\nrounds: 152"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 179.09448292988534,
            "unit": "iter/sec",
            "range": "stddev: 0.00013605248877547697",
            "extra": "mean: 5.583644921052622 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 187.56865170009183,
            "unit": "iter/sec",
            "range": "stddev: 0.00014080663921357096",
            "extra": "mean: 5.331381288590403 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 241.58627273213767,
            "unit": "iter/sec",
            "range": "stddev: 0.00011686532972218133",
            "extra": "mean: 4.139308035555334 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 203.22014721397434,
            "unit": "iter/sec",
            "range": "stddev: 0.00013260838632169332",
            "extra": "mean: 4.920771949579788 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 253.1042319777672,
            "unit": "iter/sec",
            "range": "stddev: 0.0001253401968243009",
            "extra": "mean: 3.95094144489785 msec\nrounds: 245"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "174f163f7a7731d91f310ade8ef414d584d8b7f9",
          "message": "Merge pull request #67 from stnkvcmls/claude/focused-albattani-qxc2bm\n\nP2-2: Per-interval adherence (lap ↔ step alignment)",
          "timestamp": "2026-06-20T15:55:11+02:00",
          "tree_id": "f97d660122a5f8d81a0851bfe388ead017051a3c",
          "url": "https://github.com/stnkvcmls/running-coach/commit/174f163f7a7731d91f310ade8ef414d584d8b7f9"
        },
        "date": 1781963759896,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 393.09889617133405,
            "unit": "iter/sec",
            "range": "stddev: 0.00014922627290442207",
            "extra": "mean: 2.543889107142507 msec\nrounds: 56"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 93.70278969000603,
            "unit": "iter/sec",
            "range": "stddev: 0.00042843339327823174",
            "extra": "mean: 10.672040857142763 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 105.73349308726664,
            "unit": "iter/sec",
            "range": "stddev: 0.00887822030504582",
            "extra": "mean: 9.457741069564918 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 82.29320318594841,
            "unit": "iter/sec",
            "range": "stddev: 0.013612533889175106",
            "extra": "mean: 12.151671842696608 msec\nrounds: 89"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 162.66965389249984,
            "unit": "iter/sec",
            "range": "stddev: 0.00006986624131604274",
            "extra": "mean: 6.147428091663917 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 189.96866790479623,
            "unit": "iter/sec",
            "range": "stddev: 0.0001224519264036092",
            "extra": "mean: 5.264025962961192 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 194.22454113811133,
            "unit": "iter/sec",
            "range": "stddev: 0.00010214819639843952",
            "extra": "mean: 5.148679946108916 msec\nrounds: 167"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 260.6405855531465,
            "unit": "iter/sec",
            "range": "stddev: 0.00010592503626285822",
            "extra": "mean: 3.836701018292076 msec\nrounds: 164"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 151.18823749469757,
            "unit": "iter/sec",
            "range": "stddev: 0.009262880438110278",
            "extra": "mean: 6.614271166664482 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 232.8553176581089,
            "unit": "iter/sec",
            "range": "stddev: 0.00014170733872901332",
            "extra": "mean: 4.2945121891880325 msec\nrounds: 185"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 293.8723758485556,
            "unit": "iter/sec",
            "range": "stddev: 0.00010575585408708631",
            "extra": "mean: 3.4028377016128277 msec\nrounds: 248"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 140.05849248814704,
            "unit": "iter/sec",
            "range": "stddev: 0.009883500574067462",
            "extra": "mean: 7.139874078572055 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 214.86050261594897,
            "unit": "iter/sec",
            "range": "stddev: 0.00011326391000572928",
            "extra": "mean: 4.654182540880693 msec\nrounds: 159"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 262.67603639077316,
            "unit": "iter/sec",
            "range": "stddev: 0.00012967088555776213",
            "extra": "mean: 3.806970798479455 msec\nrounds: 263"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 274.5584500162336,
            "unit": "iter/sec",
            "range": "stddev: 0.0002064508663459838",
            "extra": "mean: 3.642211703704161 msec\nrounds: 270"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 232.72403143206307,
            "unit": "iter/sec",
            "range": "stddev: 0.00038981617173711056",
            "extra": "mean: 4.296934845303762 msec\nrounds: 181"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 202.00926203813106,
            "unit": "iter/sec",
            "range": "stddev: 0.0001752110498012902",
            "extra": "mean: 4.950268071427542 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 182.40293953433485,
            "unit": "iter/sec",
            "range": "stddev: 0.010136172428707286",
            "extra": "mean: 5.48236778723494 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.661285799068111,
            "unit": "iter/sec",
            "range": "stddev: 0.004267601247070683",
            "extra": "mean: 130.52639285714105 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 22.496802698158138,
            "unit": "iter/sec",
            "range": "stddev: 0.027496260765161425",
            "extra": "mean: 44.450761000000774 msec\nrounds: 26"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 34.90946206576322,
            "unit": "iter/sec",
            "range": "stddev: 0.0012030220696367733",
            "extra": "mean: 28.645528771431017 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 113.80329571375404,
            "unit": "iter/sec",
            "range": "stddev: 0.011257275096413449",
            "extra": "mean: 8.787091742187059 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 219.98822341541597,
            "unit": "iter/sec",
            "range": "stddev: 0.00010516669217268217",
            "extra": "mean: 4.545697876343338 msec\nrounds: 186"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 217.08491666346768,
            "unit": "iter/sec",
            "range": "stddev: 0.00012740389095807915",
            "extra": "mean: 4.606492313559644 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 193.43769444205572,
            "unit": "iter/sec",
            "range": "stddev: 0.0001267643611701603",
            "extra": "mean: 5.169623236486362 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 166.99802754406235,
            "unit": "iter/sec",
            "range": "stddev: 0.0003266050550234897",
            "extra": "mean: 5.988094678161096 msec\nrounds: 87"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 178.96347318488492,
            "unit": "iter/sec",
            "range": "stddev: 0.00023617982744760456",
            "extra": "mean: 5.587732413792129 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 231.59616299964864,
            "unit": "iter/sec",
            "range": "stddev: 0.00015681359693857046",
            "extra": "mean: 4.317860827433126 msec\nrounds: 226"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 198.36906675495766,
            "unit": "iter/sec",
            "range": "stddev: 0.00014710357995207022",
            "extra": "mean: 5.041108557693045 msec\nrounds: 104"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 246.05048030753048,
            "unit": "iter/sec",
            "range": "stddev: 0.00010419820182390985",
            "extra": "mean: 4.0642066569028135 msec\nrounds: 239"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "34448a4cc1d3b9970d410d4e8d667d42b281f643",
          "message": "Merge pull request #68 from stnkvcmls/claude/p1-2-sleep-data-assignment-7avzov\n\nP1-2: HRV sync into readiness + fix overnight-data date attribution",
          "timestamp": "2026-06-21T07:00:20+02:00",
          "tree_id": "1e55b7c037b3b1b88f95ff6ef2bd2e5a2d3f3a8a",
          "url": "https://github.com/stnkvcmls/running-coach/commit/34448a4cc1d3b9970d410d4e8d667d42b281f643"
        },
        "date": 1782018072186,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 389.7306843343612,
            "unit": "iter/sec",
            "range": "stddev: 0.00014939867652751776",
            "extra": "mean: 2.5658744363635253 msec\nrounds: 55"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 97.12435630346407,
            "unit": "iter/sec",
            "range": "stddev: 0.00021760841389015985",
            "extra": "mean: 10.296078533334216 msec\nrounds: 15"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 106.5768093599493,
            "unit": "iter/sec",
            "range": "stddev: 0.008209510516688464",
            "extra": "mean: 9.382904273505039 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 75.03623763932032,
            "unit": "iter/sec",
            "range": "stddev: 0.013680477410663971",
            "extra": "mean: 13.326894197530798 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 162.03260843426756,
            "unit": "iter/sec",
            "range": "stddev: 0.0000873970291343178",
            "extra": "mean: 6.171597246153537 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 184.46571640098676,
            "unit": "iter/sec",
            "range": "stddev: 0.00010097988432634332",
            "extra": "mean: 5.421061536585076 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 183.29157565975353,
            "unit": "iter/sec",
            "range": "stddev: 0.00009893358019157248",
            "extra": "mean: 5.455788114650248 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 257.5048218611943,
            "unit": "iter/sec",
            "range": "stddev: 0.0001063982400488301",
            "extra": "mean: 3.8834224259266157 msec\nrounds: 162"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 148.92175646368395,
            "unit": "iter/sec",
            "range": "stddev: 0.00935469815854703",
            "extra": "mean: 6.714935572518982 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 228.89398827203152,
            "unit": "iter/sec",
            "range": "stddev: 0.00019748802748631705",
            "extra": "mean: 4.368834706185202 msec\nrounds: 194"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 292.0781569457983,
            "unit": "iter/sec",
            "range": "stddev: 0.00009855449999856412",
            "extra": "mean: 3.4237411330473875 msec\nrounds: 233"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 157.52262192217762,
            "unit": "iter/sec",
            "range": "stddev: 0.00013727141242898033",
            "extra": "mean: 6.348294535714619 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 185.49030858466577,
            "unit": "iter/sec",
            "range": "stddev: 0.009009320687892286",
            "extra": "mean: 5.391117237500076 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 262.8980781009441,
            "unit": "iter/sec",
            "range": "stddev: 0.00011345418824283507",
            "extra": "mean: 3.8037554600001044 msec\nrounds: 250"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 272.7100104590753,
            "unit": "iter/sec",
            "range": "stddev: 0.00014176874214435057",
            "extra": "mean: 3.6668987629629632 msec\nrounds: 270"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 231.36734389058824,
            "unit": "iter/sec",
            "range": "stddev: 0.0001484796149267713",
            "extra": "mean: 4.322131132182993 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 192.4623125111185,
            "unit": "iter/sec",
            "range": "stddev: 0.00017982835532663103",
            "extra": "mean: 5.195822428571465 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 212.228122889313,
            "unit": "iter/sec",
            "range": "stddev: 0.00014170757951701795",
            "extra": "mean: 4.711910873949289 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.3587722730305085,
            "unit": "iter/sec",
            "range": "stddev: 0.008784164850149013",
            "extra": "mean: 135.89223350000168 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 24.590264647011747,
            "unit": "iter/sec",
            "range": "stddev: 0.022503896696161062",
            "extra": "mean: 40.66650011111295 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.41306463443223,
            "unit": "iter/sec",
            "range": "stddev: 0.001492570852259764",
            "extra": "mean: 29.928413060605582 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 131.4103278389871,
            "unit": "iter/sec",
            "range": "stddev: 0.00010704551592375745",
            "extra": "mean: 7.609751961240583 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 219.4107508928421,
            "unit": "iter/sec",
            "range": "stddev: 0.0000956105371968632",
            "extra": "mean: 4.557661809782464 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 214.99119164347374,
            "unit": "iter/sec",
            "range": "stddev: 0.00037138184244288195",
            "extra": "mean: 4.651353352458875 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 195.52365711335412,
            "unit": "iter/sec",
            "range": "stddev: 0.00010686920023674751",
            "extra": "mean: 5.114470620914449 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 172.2042566913152,
            "unit": "iter/sec",
            "range": "stddev: 0.00012620492531668134",
            "extra": "mean: 5.807057381819256 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 183.56566569084515,
            "unit": "iter/sec",
            "range": "stddev: 0.0001036052969337232",
            "extra": "mean: 5.447641835615189 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 233.29531830078014,
            "unit": "iter/sec",
            "range": "stddev: 0.00012581185802891358",
            "extra": "mean: 4.286412634782204 msec\nrounds: 230"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 198.35370538532698,
            "unit": "iter/sec",
            "range": "stddev: 0.00012003680959210398",
            "extra": "mean: 5.041498962963028 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 247.2971350503074,
            "unit": "iter/sec",
            "range": "stddev: 0.00010552937701891663",
            "extra": "mean: 4.043718500000297 msec\nrounds: 246"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "48d25e6acfb27e06ee140e6f211032887e3c9c7a",
          "message": "Merge pull request #69 from stnkvcmls/claude/settings-page-issue-fcu8uj\n\nfix: exclude internal cache blobs from settings sync status display",
          "timestamp": "2026-06-21T08:45:36+02:00",
          "tree_id": "cbc8e35bb11665eceee291e3037e633b90d65479",
          "url": "https://github.com/stnkvcmls/running-coach/commit/48d25e6acfb27e06ee140e6f211032887e3c9c7a"
        },
        "date": 1782024394522,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 375.8533279995552,
            "unit": "iter/sec",
            "range": "stddev: 0.0002743853242137809",
            "extra": "mean: 2.6606123333333462 msec\nrounds: 57"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 77.85294349717185,
            "unit": "iter/sec",
            "range": "stddev: 0.00022557218711691617",
            "extra": "mean: 12.84472950000056 msec\nrounds: 12"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 89.449872994349,
            "unit": "iter/sec",
            "range": "stddev: 0.00038624701529970686",
            "extra": "mean: 11.179445722222267 msec\nrounds: 90"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 67.29315600667718,
            "unit": "iter/sec",
            "range": "stddev: 0.01679263979808439",
            "extra": "mean: 14.860352216216084 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 111.23281390132085,
            "unit": "iter/sec",
            "range": "stddev: 0.013937120678019447",
            "extra": "mean: 8.990152859812937 msec\nrounds: 107"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 159.58090913399298,
            "unit": "iter/sec",
            "range": "stddev: 0.0003755990582249033",
            "extra": "mean: 6.266413729729692 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 160.93701978806166,
            "unit": "iter/sec",
            "range": "stddev: 0.0004055035436064202",
            "extra": "mean: 6.213610773437351 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 233.46732679845715,
            "unit": "iter/sec",
            "range": "stddev: 0.0002646849511329733",
            "extra": "mean: 4.283254593749897 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 153.4580616978932,
            "unit": "iter/sec",
            "range": "stddev: 0.0003239552968015893",
            "extra": "mean: 6.516438360655567 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 200.0196773314924,
            "unit": "iter/sec",
            "range": "stddev: 0.00032343332088314864",
            "extra": "mean: 4.9995081151076 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 265.91566365829,
            "unit": "iter/sec",
            "range": "stddev: 0.00029268034123704423",
            "extra": "mean: 3.7605908062829707 msec\nrounds: 191"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 112.65356231730684,
            "unit": "iter/sec",
            "range": "stddev: 0.014591105352964392",
            "extra": "mean: 8.876772109374931 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 205.3303300431505,
            "unit": "iter/sec",
            "range": "stddev: 0.00026599562955141305",
            "extra": "mean: 4.8702011037037165 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 237.70086954635744,
            "unit": "iter/sec",
            "range": "stddev: 0.00030246582881717393",
            "extra": "mean: 4.206968202970648 msec\nrounds: 202"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 249.49503486597942,
            "unit": "iter/sec",
            "range": "stddev: 0.00031138952791797216",
            "extra": "mean: 4.008095794520189 msec\nrounds: 219"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 200.38279042426075,
            "unit": "iter/sec",
            "range": "stddev: 0.012666928852137037",
            "extra": "mean: 4.990448520467993 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 209.74113623118845,
            "unit": "iter/sec",
            "range": "stddev: 0.00038636519004423534",
            "extra": "mean: 4.767781933333974 msec\nrounds: 15"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 221.42893590884887,
            "unit": "iter/sec",
            "range": "stddev: 0.00012968618793763334",
            "extra": "mean: 4.516121598541438 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.01579931105573,
            "unit": "iter/sec",
            "range": "stddev: 0.005945158371515776",
            "extra": "mean: 110.91639969999534 msec\nrounds: 10"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 16.170385945473985,
            "unit": "iter/sec",
            "range": "stddev: 0.05513427162597787",
            "extra": "mean: 61.841442954544654 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 38.15300361689677,
            "unit": "iter/sec",
            "range": "stddev: 0.000780065836287888",
            "extra": "mean: 26.21025621052628 msec\nrounds: 38"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 104.50429821443105,
            "unit": "iter/sec",
            "range": "stddev: 0.00047178100309543184",
            "extra": "mean: 9.568984406250092 msec\nrounds: 96"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 197.020416643136,
            "unit": "iter/sec",
            "range": "stddev: 0.00039591116019427894",
            "extra": "mean: 5.075616106382034 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 185.6804240399096,
            "unit": "iter/sec",
            "range": "stddev: 0.00042952581819689326",
            "extra": "mean: 5.385597351851495 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 164.06837301850837,
            "unit": "iter/sec",
            "range": "stddev: 0.00044176103019966546",
            "extra": "mean: 6.09501990909114 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 141.55661289447053,
            "unit": "iter/sec",
            "range": "stddev: 0.0005643344816093199",
            "extra": "mean: 7.064311440861425 msec\nrounds: 93"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 154.15621286559102,
            "unit": "iter/sec",
            "range": "stddev: 0.0004695936019564226",
            "extra": "mean: 6.486926354839173 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 210.26115266298356,
            "unit": "iter/sec",
            "range": "stddev: 0.0003996413565112881",
            "extra": "mean: 4.75599028795798 msec\nrounds: 191"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 170.883052726479,
            "unit": "iter/sec",
            "range": "stddev: 0.0005312336518751046",
            "extra": "mean: 5.8519553814422585 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 183.12405569848485,
            "unit": "iter/sec",
            "range": "stddev: 0.015948065423920264",
            "extra": "mean: 5.460779012269734 msec\nrounds: 163"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "4170ca1a6b0053b0db208a590043d40c7825349e",
          "message": "Merge pull request #70 from stnkvcmls/claude/p3-3-implementation-n2oroc\n\nP3-3: adopt Alembic for schema migrations",
          "timestamp": "2026-06-21T08:59:18+02:00",
          "tree_id": "9524af728e8170a8a1ffa19a1a2678a493ebf59c",
          "url": "https://github.com/stnkvcmls/running-coach/commit/4170ca1a6b0053b0db208a590043d40c7825349e"
        },
        "date": 1782025213117,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 423.77511834737857,
            "unit": "iter/sec",
            "range": "stddev: 0.00017903761492739988",
            "extra": "mean: 2.359742129032399 msec\nrounds: 62"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 95.92623612292212,
            "unit": "iter/sec",
            "range": "stddev: 0.0004981003689386229",
            "extra": "mean: 10.424676714288848 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 111.5594177417309,
            "unit": "iter/sec",
            "range": "stddev: 0.00033633358678480675",
            "extra": "mean: 8.963833087719058 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 68.61934671599258,
            "unit": "iter/sec",
            "range": "stddev: 0.01950020075471298",
            "extra": "mean: 14.573149525000328 msec\nrounds: 80"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 160.96771323778063,
            "unit": "iter/sec",
            "range": "stddev: 0.00019328959351187666",
            "extra": "mean: 6.212425957265141 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 189.50739907893353,
            "unit": "iter/sec",
            "range": "stddev: 0.00010081354925158837",
            "extra": "mean: 5.276838819277343 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 188.61111261557534,
            "unit": "iter/sec",
            "range": "stddev: 0.0000730024975254268",
            "extra": "mean: 5.301914537974158 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 274.21062446775454,
            "unit": "iter/sec",
            "range": "stddev: 0.0001372092569791024",
            "extra": "mean: 3.646831708074804 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 176.6399569930581,
            "unit": "iter/sec",
            "range": "stddev: 0.00028134679358988063",
            "extra": "mean: 5.661233262411288 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 239.0302134899353,
            "unit": "iter/sec",
            "range": "stddev: 0.00016650386997949415",
            "extra": "mean: 4.183571546875209 msec\nrounds: 192"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 259.48787866773665,
            "unit": "iter/sec",
            "range": "stddev: 0.008944133278645378",
            "extra": "mean: 3.853744556910337 msec\nrounds: 246"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 156.39047108861516,
            "unit": "iter/sec",
            "range": "stddev: 0.0003953157735415045",
            "extra": "mean: 6.394251472222834 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 207.97096030868875,
            "unit": "iter/sec",
            "range": "stddev: 0.010508195868707772",
            "extra": "mean: 4.808363622092778 msec\nrounds: 172"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 272.4622521835857,
            "unit": "iter/sec",
            "range": "stddev: 0.0005359047797200137",
            "extra": "mean: 3.6702331863798796 msec\nrounds: 279"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 289.98544972422735,
            "unit": "iter/sec",
            "range": "stddev: 0.00011549487810843774",
            "extra": "mean: 3.4484488823525044 msec\nrounds: 272"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 249.37805247787423,
            "unit": "iter/sec",
            "range": "stddev: 0.00011616774772943001",
            "extra": "mean: 4.009975978494434 msec\nrounds: 186"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 216.7082274521237,
            "unit": "iter/sec",
            "range": "stddev: 0.00012937576209553022",
            "extra": "mean: 4.614499466666189 msec\nrounds: 15"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 219.86939205387102,
            "unit": "iter/sec",
            "range": "stddev: 0.00012442823211742375",
            "extra": "mean: 4.548154659721742 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.273585431775873,
            "unit": "iter/sec",
            "range": "stddev: 0.006686841762706527",
            "extra": "mean: 107.83315766666766 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.770747318091985,
            "unit": "iter/sec",
            "range": "stddev: 0.03574018212833737",
            "extra": "mean: 45.93319583333629 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 36.535023926871204,
            "unit": "iter/sec",
            "range": "stddev: 0.02490156940492344",
            "extra": "mean: 27.370996170732173 msec\nrounds: 41"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 132.21637230756468,
            "unit": "iter/sec",
            "range": "stddev: 0.00009947520487335696",
            "extra": "mean: 7.563359836206802 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 227.64589223251912,
            "unit": "iter/sec",
            "range": "stddev: 0.00014014442008603917",
            "extra": "mean: 4.392787368983548 msec\nrounds: 187"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 222.8407094228345,
            "unit": "iter/sec",
            "range": "stddev: 0.00012806505309630322",
            "extra": "mean: 4.487510395160903 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 198.97918568821115,
            "unit": "iter/sec",
            "range": "stddev: 0.00014813954904728513",
            "extra": "mean: 5.025651283782727 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 176.15095571928455,
            "unit": "iter/sec",
            "range": "stddev: 0.00015420707498083546",
            "extra": "mean: 5.676949045871811 msec\nrounds: 109"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 184.7345488722488,
            "unit": "iter/sec",
            "range": "stddev: 0.0001338487909488465",
            "extra": "mean: 5.413172609588795 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 234.42753521384455,
            "unit": "iter/sec",
            "range": "stddev: 0.0001378641278144163",
            "extra": "mean: 4.265710506608369 msec\nrounds: 227"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 182.88077541970813,
            "unit": "iter/sec",
            "range": "stddev: 0.0002952925747359109",
            "extra": "mean: 5.468043306930528 msec\nrounds: 101"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 205.6400806360313,
            "unit": "iter/sec",
            "range": "stddev: 0.011686698534243974",
            "extra": "mean: 4.86286523963162 msec\nrounds: 217"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e47df67140a77fb7b6a8ec45701a83ac1e366ff3",
          "message": "Merge pull request #71 from stnkvcmls/fix/alembic-dockerfile\n\nfix: add alembic/ to Docker image",
          "timestamp": "2026-06-21T09:50:32+02:00",
          "tree_id": "ae1a65e93ced588f755a3a937a5913434016fd83",
          "url": "https://github.com/stnkvcmls/running-coach/commit/e47df67140a77fb7b6a8ec45701a83ac1e366ff3"
        },
        "date": 1782028285051,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 388.6744724939527,
            "unit": "iter/sec",
            "range": "stddev: 0.00018384110379732156",
            "extra": "mean: 2.5728471272719324 msec\nrounds: 55"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 95.76707804894312,
            "unit": "iter/sec",
            "range": "stddev: 0.000235881084418142",
            "extra": "mean: 10.442001785717382 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 106.13959131535789,
            "unit": "iter/sec",
            "range": "stddev: 0.008808946444265468",
            "extra": "mean: 9.421555025860599 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 74.08832661544903,
            "unit": "iter/sec",
            "range": "stddev: 0.014156370462459307",
            "extra": "mean: 13.497402974026384 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 160.56114791897593,
            "unit": "iter/sec",
            "range": "stddev: 0.00012170819267073628",
            "extra": "mean: 6.228156767443084 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 184.07189279108317,
            "unit": "iter/sec",
            "range": "stddev: 0.0001102430934810095",
            "extra": "mean: 5.432659950614915 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 182.57003484464042,
            "unit": "iter/sec",
            "range": "stddev: 0.00009971709751072299",
            "extra": "mean: 5.477350107595471 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 254.70160781767123,
            "unit": "iter/sec",
            "range": "stddev: 0.00015707545313339347",
            "extra": "mean: 3.926162887498741 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 170.56186849534257,
            "unit": "iter/sec",
            "range": "stddev: 0.00011934343259196477",
            "extra": "mean: 5.862975170369374 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 203.81219643211327,
            "unit": "iter/sec",
            "range": "stddev: 0.007363187934102215",
            "extra": "mean: 4.906477715788146 msec\nrounds: 190"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 289.8754075037482,
            "unit": "iter/sec",
            "range": "stddev: 0.00010974996270224008",
            "extra": "mean: 3.449757979165824 msec\nrounds: 240"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 156.15107055655906,
            "unit": "iter/sec",
            "range": "stddev: 0.0002686379016130934",
            "extra": "mean: 6.4040547172412285 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 231.95696788313978,
            "unit": "iter/sec",
            "range": "stddev: 0.00011297241876624687",
            "extra": "mean: 4.311144472727379 msec\nrounds: 165"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 260.63961696257206,
            "unit": "iter/sec",
            "range": "stddev: 0.00012444869041605718",
            "extra": "mean: 3.8367152762643917 msec\nrounds: 257"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 245.94444889300087,
            "unit": "iter/sec",
            "range": "stddev: 0.007034464742524393",
            "extra": "mean: 4.065958815094274 msec\nrounds: 265"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 236.61740730026327,
            "unit": "iter/sec",
            "range": "stddev: 0.00013077875043512654",
            "extra": "mean: 4.226231752810214 msec\nrounds: 178"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 192.32478755084122,
            "unit": "iter/sec",
            "range": "stddev: 0.00032511373220710357",
            "extra": "mean: 5.199537785713915 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 211.76125224728534,
            "unit": "iter/sec",
            "range": "stddev: 0.00010950548785663179",
            "extra": "mean: 4.722299237408384 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.426457984348099,
            "unit": "iter/sec",
            "range": "stddev: 0.007674493896409815",
            "extra": "mean: 134.6536938750056 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 24.319150326500527,
            "unit": "iter/sec",
            "range": "stddev: 0.023598866241298463",
            "extra": "mean: 41.11985766666782 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.583355720676636,
            "unit": "iter/sec",
            "range": "stddev: 0.0015113400155038934",
            "extra": "mean: 29.77665508823226 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 116.20206765129035,
            "unit": "iter/sec",
            "range": "stddev: 0.010700454847514886",
            "extra": "mean: 8.60569885039301 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 213.29965508932872,
            "unit": "iter/sec",
            "range": "stddev: 0.00021027290080543316",
            "extra": "mean: 4.688240117318547 msec\nrounds: 179"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 215.90006305620471,
            "unit": "iter/sec",
            "range": "stddev: 0.0001412016260540696",
            "extra": "mean: 4.6317726166651125 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 194.13908057282194,
            "unit": "iter/sec",
            "range": "stddev: 0.00009040901607594317",
            "extra": "mean: 5.150946409395908 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 169.559603696929,
            "unit": "iter/sec",
            "range": "stddev: 0.00011378791462441398",
            "extra": "mean: 5.897631146787775 msec\nrounds: 109"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 180.91673554290756,
            "unit": "iter/sec",
            "range": "stddev: 0.00011708152630094637",
            "extra": "mean: 5.5274046206899 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 231.94048423199004,
            "unit": "iter/sec",
            "range": "stddev: 0.00009669225555733375",
            "extra": "mean: 4.311450859091017 msec\nrounds: 220"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 197.97359579963776,
            "unit": "iter/sec",
            "range": "stddev: 0.00010758650919421951",
            "extra": "mean: 5.051178648146925 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 240.0391206634032,
            "unit": "iter/sec",
            "range": "stddev: 0.00029155780342660326",
            "extra": "mean: 4.165987599172462 msec\nrounds: 242"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "63cadb6cdfb6d462d5b35f1ff304fa703f185bae",
          "message": "Merge pull request #72 from stnkvcmls/claude/p0-1-improvement-plan-js6p5i\n\nfeat: P0-1 — ACWR, ramp rate, and injury-risk flag",
          "timestamp": "2026-06-21T10:18:12+02:00",
          "tree_id": "a035ce726ee1bf1bbb403bfe3745cf39fdcd3156",
          "url": "https://github.com/stnkvcmls/running-coach/commit/63cadb6cdfb6d462d5b35f1ff304fa703f185bae"
        },
        "date": 1782029944963,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 413.70582578461864,
            "unit": "iter/sec",
            "range": "stddev: 0.00022139214921179762",
            "extra": "mean: 2.417176500000788 msec\nrounds: 60"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 75.38898406992865,
            "unit": "iter/sec",
            "range": "stddev: 0.0005709905984817474",
            "extra": "mean: 13.264537416665926 msec\nrounds: 12"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 69.15706012306507,
            "unit": "iter/sec",
            "range": "stddev: 0.01907937344170963",
            "extra": "mean: 14.459839649350318 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 65.83736304724654,
            "unit": "iter/sec",
            "range": "stddev: 0.025004793528457542",
            "extra": "mean: 15.18894368965499 msec\nrounds: 58"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 152.7112325855815,
            "unit": "iter/sec",
            "range": "stddev: 0.00023692588761946537",
            "extra": "mean: 6.548306781818331 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 175.1973837433585,
            "unit": "iter/sec",
            "range": "stddev: 0.0003447323927946705",
            "extra": "mean: 5.707847792207163 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 174.63522240539803,
            "unit": "iter/sec",
            "range": "stddev: 0.0002937230092002128",
            "extra": "mean: 5.726221699300734 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 270.2981223348119,
            "unit": "iter/sec",
            "range": "stddev: 0.00014619675720556517",
            "extra": "mean: 3.6996187445258073 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 125.37176506502436,
            "unit": "iter/sec",
            "range": "stddev: 0.01803587741797787",
            "extra": "mean: 7.976277589147346 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 229.41854657085636,
            "unit": "iter/sec",
            "range": "stddev: 0.00018329342402685297",
            "extra": "mean: 4.358845502890273 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 301.44577150124667,
            "unit": "iter/sec",
            "range": "stddev: 0.00015229302033897916",
            "extra": "mean: 3.3173462511013008 msec\nrounds: 227"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 144.9174349140427,
            "unit": "iter/sec",
            "range": "stddev: 0.00037360052730202786",
            "extra": "mean: 6.900480957264713 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 240.20216144123327,
            "unit": "iter/sec",
            "range": "stddev: 0.00018941630110958882",
            "extra": "mean: 4.163159873333011 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 272.08404574277284,
            "unit": "iter/sec",
            "range": "stddev: 0.00017112514465769863",
            "extra": "mean: 3.675334940239002 msec\nrounds: 251"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 230.27919518311236,
            "unit": "iter/sec",
            "range": "stddev: 0.013963787742940633",
            "extra": "mean: 4.342554694117393 msec\nrounds: 255"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 237.99906191877866,
            "unit": "iter/sec",
            "range": "stddev: 0.0008856178945611011",
            "extra": "mean: 4.201697233333077 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 196.19116160498908,
            "unit": "iter/sec",
            "range": "stddev: 0.00034375789123910317",
            "extra": "mean: 5.097069571428493 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 190.42962996754233,
            "unit": "iter/sec",
            "range": "stddev: 0.0003442679522260884",
            "extra": "mean: 5.251283637795465 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.140241780671542,
            "unit": "iter/sec",
            "range": "stddev: 0.08101947276950754",
            "extra": "mean: 140.0512798750002 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 17.366438613599485,
            "unit": "iter/sec",
            "range": "stddev: 0.05051411366933083",
            "extra": "mean: 57.582330047618974 msec\nrounds: 21"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 38.103632175065385,
            "unit": "iter/sec",
            "range": "stddev: 0.0011375933439377738",
            "extra": "mean: 26.24421722857144 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 118.26176697452019,
            "unit": "iter/sec",
            "range": "stddev: 0.00029330166311232096",
            "extra": "mean: 8.455818186916256 msec\nrounds: 107"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 221.24983067964385,
            "unit": "iter/sec",
            "range": "stddev: 0.00018282443188498044",
            "extra": "mean: 4.519777470238784 msec\nrounds: 168"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 217.59862127112626,
            "unit": "iter/sec",
            "range": "stddev: 0.00020074740834462735",
            "extra": "mean: 4.595617353448245 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 191.53100978059092,
            "unit": "iter/sec",
            "range": "stddev: 0.00018866659144918543",
            "extra": "mean: 5.221086659259791 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 169.94055843196202,
            "unit": "iter/sec",
            "range": "stddev: 0.00022735466949992596",
            "extra": "mean: 5.88441046226386 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 133.820227512213,
            "unit": "iter/sec",
            "range": "stddev: 0.02241889417878207",
            "extra": "mean: 7.472711850745702 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 231.71549959428486,
            "unit": "iter/sec",
            "range": "stddev: 0.00018462282738878792",
            "extra": "mean: 4.315637071110561 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 188.62917100028469,
            "unit": "iter/sec",
            "range": "stddev: 0.00023029297402734136",
            "extra": "mean: 5.301406960000321 msec\nrounds: 100"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 240.96996640247772,
            "unit": "iter/sec",
            "range": "stddev: 0.00018513897676509684",
            "extra": "mean: 4.149894756302367 msec\nrounds: 238"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "5928f6fbb9ede8e40818267b7bfb2f813b00cc5b",
          "message": "Merge pull request #73 from stnkvcmls/claude/p0-2-improvements-btqrz7\n\nfeat: P0-2 — power-duration/pace curve view + race predictions",
          "timestamp": "2026-06-21T10:41:38+02:00",
          "tree_id": "8cf1b67374e71e3a49484307d296b18894ebf729",
          "url": "https://github.com/stnkvcmls/running-coach/commit/5928f6fbb9ede8e40818267b7bfb2f813b00cc5b"
        },
        "date": 1782031352732,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 386.2846388845803,
            "unit": "iter/sec",
            "range": "stddev: 0.00016552209000456942",
            "extra": "mean: 2.5887646034477556 msec\nrounds: 58"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 83.43585572046615,
            "unit": "iter/sec",
            "range": "stddev: 0.00024400207322874506",
            "extra": "mean: 11.985254916666577 msec\nrounds: 12"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 85.73930422790214,
            "unit": "iter/sec",
            "range": "stddev: 0.00925754694626004",
            "extra": "mean: 11.6632623626373 msec\nrounds: 91"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 75.26390650416509,
            "unit": "iter/sec",
            "range": "stddev: 0.014340886407957179",
            "extra": "mean: 13.286581130952328 msec\nrounds: 84"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 162.84605550557316,
            "unit": "iter/sec",
            "range": "stddev: 0.00009137544429940307",
            "extra": "mean: 6.140768942148412 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 184.75983716526707,
            "unit": "iter/sec",
            "range": "stddev: 0.0001065827295125924",
            "extra": "mean: 5.4124317023807675 msec\nrounds: 84"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 182.90670048270246,
            "unit": "iter/sec",
            "range": "stddev: 0.00018661357210888563",
            "extra": "mean: 5.467268270440264 msec\nrounds: 159"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 256.2789068991714,
            "unit": "iter/sec",
            "range": "stddev: 0.00012824449134169637",
            "extra": "mean: 3.9019988500006875 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 169.22093661976476,
            "unit": "iter/sec",
            "range": "stddev: 0.0003611542937665004",
            "extra": "mean: 5.909434257812762 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 205.18845000550075,
            "unit": "iter/sec",
            "range": "stddev: 0.007227637531257149",
            "extra": "mean: 4.873568663212728 msec\nrounds: 193"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 291.98148581895975,
            "unit": "iter/sec",
            "range": "stddev: 0.00009790736784848551",
            "extra": "mean: 3.4248746875000156 msec\nrounds: 224"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 141.59967264483464,
            "unit": "iter/sec",
            "range": "stddev: 0.008484305597428365",
            "extra": "mean: 7.062163219178026 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 230.33684336479507,
            "unit": "iter/sec",
            "range": "stddev: 0.00012973925281226377",
            "extra": "mean: 4.34146784939765 msec\nrounds: 166"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 263.1503881319003,
            "unit": "iter/sec",
            "range": "stddev: 0.00011349258275969219",
            "extra": "mean: 3.800108398467437 msec\nrounds: 261"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 276.23033842061136,
            "unit": "iter/sec",
            "range": "stddev: 0.00009722606346275313",
            "extra": "mean: 3.6201671609195825 msec\nrounds: 261"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 238.20472750839835,
            "unit": "iter/sec",
            "range": "stddev: 0.00011928780160166022",
            "extra": "mean: 4.198069494505491 msec\nrounds: 182"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 205.3665055004083,
            "unit": "iter/sec",
            "range": "stddev: 0.00010545555951464515",
            "extra": "mean: 4.869343214285798 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 29.051925086745992,
            "unit": "iter/sec",
            "range": "stddev: 0.0004076440469552082",
            "extra": "mean: 34.42112689655179 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 213.7165367394038,
            "unit": "iter/sec",
            "range": "stddev: 0.0001076994729936327",
            "extra": "mean: 4.679095100719111 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.732757898093499,
            "unit": "iter/sec",
            "range": "stddev: 0.04783770061820818",
            "extra": "mean: 148.5275447500003 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 23.928565362554096,
            "unit": "iter/sec",
            "range": "stddev: 0.023227318440404297",
            "extra": "mean: 41.79105537036934 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.4790717229779,
            "unit": "iter/sec",
            "range": "stddev: 0.0016128465585168686",
            "extra": "mean: 29.869406424242758 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 114.3506351989262,
            "unit": "iter/sec",
            "range": "stddev: 0.01062554980719821",
            "extra": "mean: 8.745032314515646 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 217.65206785664375,
            "unit": "iter/sec",
            "range": "stddev: 0.00010980831652514315",
            "extra": "mean: 4.594488854838948 msec\nrounds: 186"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 217.21360787647947,
            "unit": "iter/sec",
            "range": "stddev: 0.0001292677781189774",
            "extra": "mean: 4.603763133333061 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 194.2328605856822,
            "unit": "iter/sec",
            "range": "stddev: 0.0000976822572807947",
            "extra": "mean: 5.148459416108268 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 170.59382100011825,
            "unit": "iter/sec",
            "range": "stddev: 0.0001257258041429647",
            "extra": "mean: 5.8618770254246595 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 182.01494087592081,
            "unit": "iter/sec",
            "range": "stddev: 0.00011060516422688013",
            "extra": "mean: 5.494054472603421 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 231.1634050737562,
            "unit": "iter/sec",
            "range": "stddev: 0.0001108157102196241",
            "extra": "mean: 4.32594423706873 msec\nrounds: 232"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 197.41920561906272,
            "unit": "iter/sec",
            "range": "stddev: 0.0001329308409041192",
            "extra": "mean: 5.065363305784877 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 242.89308647882615,
            "unit": "iter/sec",
            "range": "stddev: 0.00014098653159187838",
            "extra": "mean: 4.1170377242794585 msec\nrounds: 243"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "254278d39d2c2c4b616fcf534949d897fa7ad145",
          "message": "Merge pull request #74 from stnkvcmls/claude/p0-3-improvements-drzfvs\n\nfeat: P0-3 — closed-loop plan generation (adherence + readiness aware)",
          "timestamp": "2026-06-21T10:55:23+02:00",
          "tree_id": "9926776adf7d775802622dcd7365825c6c814489",
          "url": "https://github.com/stnkvcmls/running-coach/commit/254278d39d2c2c4b616fcf534949d897fa7ad145"
        },
        "date": 1782032178963,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 379.3732810955358,
            "unit": "iter/sec",
            "range": "stddev: 0.00019611712949432658",
            "extra": "mean: 2.635926275862782 msec\nrounds: 58"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 79.73115028203564,
            "unit": "iter/sec",
            "range": "stddev: 0.000321730138339393",
            "extra": "mean: 12.542149416666723 msec\nrounds: 12"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 83.55312901739676,
            "unit": "iter/sec",
            "range": "stddev: 0.010496059396662361",
            "extra": "mean: 11.968432681818392 msec\nrounds: 88"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 77.87996622836815,
            "unit": "iter/sec",
            "range": "stddev: 0.011083411668838146",
            "extra": "mean: 12.840272645569602 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 141.86360145656676,
            "unit": "iter/sec",
            "range": "stddev: 0.0087629662641763",
            "extra": "mean: 7.049024483606966 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 182.23351422069092,
            "unit": "iter/sec",
            "range": "stddev: 0.00014589192020508375",
            "extra": "mean: 5.487464829268267 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 180.26363323078627,
            "unit": "iter/sec",
            "range": "stddev: 0.0001188530745290114",
            "extra": "mean: 5.547430627450681 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 252.18811685579314,
            "unit": "iter/sec",
            "range": "stddev: 0.00022341858698828797",
            "extra": "mean: 3.965293894366255 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 168.50794623020084,
            "unit": "iter/sec",
            "range": "stddev: 0.0001809300187546685",
            "extra": "mean: 5.934438240876115 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 228.41703809344614,
            "unit": "iter/sec",
            "range": "stddev: 0.00012388005782327797",
            "extra": "mean: 4.377957127659176 msec\nrounds: 188"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 251.8297246609194,
            "unit": "iter/sec",
            "range": "stddev: 0.007828833518458351",
            "extra": "mean: 3.9709371137440894 msec\nrounds: 211"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 155.0980271065784,
            "unit": "iter/sec",
            "range": "stddev: 0.00015359180828073126",
            "extra": "mean: 6.447535269503022 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 231.56356179787053,
            "unit": "iter/sec",
            "range": "stddev: 0.000123488945852725",
            "extra": "mean: 4.318468727272773 msec\nrounds: 165"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 226.30055266628685,
            "unit": "iter/sec",
            "range": "stddev: 0.0077152088531345",
            "extra": "mean: 4.418902155641864 msec\nrounds: 257"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 274.75228963209724,
            "unit": "iter/sec",
            "range": "stddev: 0.00011507783168643014",
            "extra": "mean: 3.6396420984845452 msec\nrounds: 264"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 235.650942622788,
            "unit": "iter/sec",
            "range": "stddev: 0.0001423790643019779",
            "extra": "mean: 4.243564608187134 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 201.11850331750657,
            "unit": "iter/sec",
            "range": "stddev: 0.00011749683091108636",
            "extra": "mean: 4.972192928570556 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.19595489391602,
            "unit": "iter/sec",
            "range": "stddev: 0.00036336941654994064",
            "extra": "mean: 35.466080285714135 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 211.40613897566487,
            "unit": "iter/sec",
            "range": "stddev: 0.00012923921607839206",
            "extra": "mean: 4.7302316046513235 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.420317117102452,
            "unit": "iter/sec",
            "range": "stddev: 0.0059389344951548614",
            "extra": "mean: 134.76512987500033 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 20.14944110437302,
            "unit": "iter/sec",
            "range": "stddev: 0.0363066406867165",
            "extra": "mean: 49.62916811538612 msec\nrounds: 26"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.164441592652615,
            "unit": "iter/sec",
            "range": "stddev: 0.0010687265085473022",
            "extra": "mean: 31.09023351515084 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 128.43147595809765,
            "unit": "iter/sec",
            "range": "stddev: 0.0002159212414220731",
            "extra": "mean: 7.786253272727803 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 216.61930477855307,
            "unit": "iter/sec",
            "range": "stddev: 0.00013808753258300554",
            "extra": "mean: 4.616393728261136 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 214.25338707919337,
            "unit": "iter/sec",
            "range": "stddev: 0.00016966563443345265",
            "extra": "mean: 4.66737078761035 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 189.00169901728927,
            "unit": "iter/sec",
            "range": "stddev: 0.00025646969096692327",
            "extra": "mean: 5.2909577278907065 msec\nrounds: 147"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 166.77314385543409,
            "unit": "iter/sec",
            "range": "stddev: 0.00020575704131143609",
            "extra": "mean: 5.996169268517487 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 177.36964317074234,
            "unit": "iter/sec",
            "range": "stddev: 0.0001905666318490652",
            "extra": "mean: 5.637943348836555 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 199.56961083819974,
            "unit": "iter/sec",
            "range": "stddev: 0.009676301314183842",
            "extra": "mean: 5.010782933333202 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 189.26706029412927,
            "unit": "iter/sec",
            "range": "stddev: 0.0002767843239607937",
            "extra": "mean: 5.283539557522351 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 239.31746102717102,
            "unit": "iter/sec",
            "range": "stddev: 0.0001697107081607456",
            "extra": "mean: 4.178550097046468 msec\nrounds: 237"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "ef9c75b39ebd5b139d7c50c1b8a0b5ae4085855f",
          "message": "Merge pull request #75 from stnkvcmls/claude/p1-1-improvement-plan-oq4jwq\n\nfeat: P1-1 — plan realignment after missed sessions",
          "timestamp": "2026-06-21T11:18:34+02:00",
          "tree_id": "b60c7a8bf068ff29e9d03833878dca379948febb",
          "url": "https://github.com/stnkvcmls/running-coach/commit/ef9c75b39ebd5b139d7c50c1b8a0b5ae4085855f"
        },
        "date": 1782033564733,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 420.70484328407565,
            "unit": "iter/sec",
            "range": "stddev: 0.0002465120721546333",
            "extra": "mean: 2.376963365084824 msec\nrounds: 63"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 79.75028363334991,
            "unit": "iter/sec",
            "range": "stddev: 0.0004520636313008889",
            "extra": "mean: 12.539140357136246 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 91.67278103967914,
            "unit": "iter/sec",
            "range": "stddev: 0.0001593251572607184",
            "extra": "mean: 10.9083632967038 msec\nrounds: 91"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 79.57066311929063,
            "unit": "iter/sec",
            "range": "stddev: 0.0126470018552508",
            "extra": "mean: 12.567445849996517 msec\nrounds: 80"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 162.20846995365133,
            "unit": "iter/sec",
            "range": "stddev: 0.0001386913358007708",
            "extra": "mean: 6.164906186993411 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 149.05076159080735,
            "unit": "iter/sec",
            "range": "stddev: 0.013082390220395526",
            "extra": "mean: 6.709123719510566 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 188.1218842108106,
            "unit": "iter/sec",
            "range": "stddev: 0.00011032290715783784",
            "extra": "mean: 5.315702658386057 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 271.5927633517675,
            "unit": "iter/sec",
            "range": "stddev: 0.00012827817198474975",
            "extra": "mean: 3.681983229813815 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 173.9546909911098,
            "unit": "iter/sec",
            "range": "stddev: 0.0001294791965077427",
            "extra": "mean: 5.74862335877511 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 236.62272957866708,
            "unit": "iter/sec",
            "range": "stddev: 0.000145615873826411",
            "extra": "mean: 4.226136693548462 msec\nrounds: 186"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 308.644548130617,
            "unit": "iter/sec",
            "range": "stddev: 0.00010848518879192418",
            "extra": "mean: 3.239972991769174 msec\nrounds: 243"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 133.64457279318452,
            "unit": "iter/sec",
            "range": "stddev: 0.012624680151820632",
            "extra": "mean: 7.482533552241614 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 245.69430759726916,
            "unit": "iter/sec",
            "range": "stddev: 0.00013457234126875987",
            "extra": "mean: 4.070098366459324 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 268.24869350666233,
            "unit": "iter/sec",
            "range": "stddev: 0.0005720710238588106",
            "extra": "mean: 3.727883953235968 msec\nrounds: 278"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 286.64168622598856,
            "unit": "iter/sec",
            "range": "stddev: 0.00013636073468578907",
            "extra": "mean: 3.488676099998934 msec\nrounds: 270"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 234.6364321133806,
            "unit": "iter/sec",
            "range": "stddev: 0.00036528058311039536",
            "extra": "mean: 4.261912743016744 msec\nrounds: 179"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 206.3877510170058,
            "unit": "iter/sec",
            "range": "stddev: 0.0002508835092306904",
            "extra": "mean: 4.845248785707262 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.648809218611262,
            "unit": "iter/sec",
            "range": "stddev: 0.001191623358071355",
            "extra": "mean: 36.16792289654446 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 215.8365939786155,
            "unit": "iter/sec",
            "range": "stddev: 0.00013790503698117283",
            "extra": "mean: 4.633134639342378 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 172.04276267500018,
            "unit": "iter/sec",
            "range": "stddev: 0.00040823046671589736",
            "extra": "mean: 5.812508381355537 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.536027663695211,
            "unit": "iter/sec",
            "range": "stddev: 0.004491741269597819",
            "extra": "mean: 104.86546760000692 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 20.83582211078776,
            "unit": "iter/sec",
            "range": "stddev: 0.035057010586467936",
            "extra": "mean: 47.99426654167149 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 41.054595547624544,
            "unit": "iter/sec",
            "range": "stddev: 0.0009361976107505453",
            "extra": "mean: 24.357809074990655 msec\nrounds: 40"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 125.38000819373643,
            "unit": "iter/sec",
            "range": "stddev: 0.00027940004288965815",
            "extra": "mean: 7.975753187500243 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 220.80180584091053,
            "unit": "iter/sec",
            "range": "stddev: 0.00019575816223313134",
            "extra": "mean: 4.528948466664752 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 168.55035645246107,
            "unit": "iter/sec",
            "range": "stddev: 0.015866787643251227",
            "extra": "mean: 5.932945032258331 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 191.57958964575485,
            "unit": "iter/sec",
            "range": "stddev: 0.00023951957826374548",
            "extra": "mean: 5.219762720282863 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 172.81828244184476,
            "unit": "iter/sec",
            "range": "stddev: 0.00019344008109677786",
            "extra": "mean: 5.7864248265313645 msec\nrounds: 98"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 181.9857934912889,
            "unit": "iter/sec",
            "range": "stddev: 0.00014520629271149135",
            "extra": "mean: 5.494934416668447 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 232.75104520128647,
            "unit": "iter/sec",
            "range": "stddev: 0.00017736605417494714",
            "extra": "mean: 4.296436130437934 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 222.65225178167142,
            "unit": "iter/sec",
            "range": "stddev: 0.0001946928051156284",
            "extra": "mean: 4.491308720203652 msec\nrounds: 193"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 188.70776189952667,
            "unit": "iter/sec",
            "range": "stddev: 0.0003023598681568682",
            "extra": "mean: 5.299199089290393 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 234.88581327352088,
            "unit": "iter/sec",
            "range": "stddev: 0.0002283299409178593",
            "extra": "mean: 4.257387817779848 msec\nrounds: 225"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "abbcddc5f8f8dcd474035f3432ade46e5db1335b",
          "message": "Merge pull request #76 from stnkvcmls/claude/p2-1-improvement-perf-ax2it4\n\nfeat(p2-1): time-in-zone / intensity distribution view",
          "timestamp": "2026-06-21T14:04:47+02:00",
          "tree_id": "a8a36cd8ffea6906a22a8d6ebc3f826d2ad3634f",
          "url": "https://github.com/stnkvcmls/running-coach/commit/abbcddc5f8f8dcd474035f3432ade46e5db1335b"
        },
        "date": 1782043542936,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 418.36621474716117,
            "unit": "iter/sec",
            "range": "stddev: 0.00022212165684844695",
            "extra": "mean: 2.3902503709682867 msec\nrounds: 62"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 78.9952820979241,
            "unit": "iter/sec",
            "range": "stddev: 0.0002395636100822541",
            "extra": "mean: 12.658983846154005 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 89.14015012088538,
            "unit": "iter/sec",
            "range": "stddev: 0.0003715249499839643",
            "extra": "mean: 11.21828938636375 msec\nrounds: 88"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 74.52380297351517,
            "unit": "iter/sec",
            "range": "stddev: 0.015526547552755747",
            "extra": "mean: 13.418531530863872 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 130.77998030875253,
            "unit": "iter/sec",
            "range": "stddev: 0.012917067682683813",
            "extra": "mean: 7.6464302689077135 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 187.89051473016244,
            "unit": "iter/sec",
            "range": "stddev: 0.00012514528241103478",
            "extra": "mean: 5.322248445783133 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 183.84345383231488,
            "unit": "iter/sec",
            "range": "stddev: 0.00021184641212437547",
            "extra": "mean: 5.439410428570974 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 273.34341571985516,
            "unit": "iter/sec",
            "range": "stddev: 0.00012006345085369668",
            "extra": "mean: 3.658401638709609 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 176.37948675361417,
            "unit": "iter/sec",
            "range": "stddev: 0.0001760164907988927",
            "extra": "mean: 5.669593547445273 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 238.45891354927738,
            "unit": "iter/sec",
            "range": "stddev: 0.00014981838349496302",
            "extra": "mean: 4.193594548913143 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 252.8848649096576,
            "unit": "iter/sec",
            "range": "stddev: 0.010146033508003697",
            "extra": "mean: 3.954368721739228 msec\nrounds: 230"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 155.02827341715323,
            "unit": "iter/sec",
            "range": "stddev: 0.00016317321627067925",
            "extra": "mean: 6.450436284671633 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 240.7465232256801,
            "unit": "iter/sec",
            "range": "stddev: 0.00015878716391759052",
            "extra": "mean: 4.153746382715492 msec\nrounds: 162"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 237.2269654124004,
            "unit": "iter/sec",
            "range": "stddev: 0.010132117193758566",
            "extra": "mean: 4.2153723893132415 msec\nrounds: 262"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 285.7672796024667,
            "unit": "iter/sec",
            "range": "stddev: 0.00013779054129050048",
            "extra": "mean: 3.4993509452555536 msec\nrounds: 274"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 242.69975355015544,
            "unit": "iter/sec",
            "range": "stddev: 0.00011896111657915284",
            "extra": "mean: 4.120317327777359 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 208.78762351116342,
            "unit": "iter/sec",
            "range": "stddev: 0.00029482629537846",
            "extra": "mean: 4.789555928570317 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.637109865361644,
            "unit": "iter/sec",
            "range": "stddev: 0.0004282360023108137",
            "extra": "mean: 36.183233517240076 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 209.6487122365912,
            "unit": "iter/sec",
            "range": "stddev: 0.00018849544902559975",
            "extra": "mean: 4.769883818181947 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 211.76025718912166,
            "unit": "iter/sec",
            "range": "stddev: 0.0001765773853705098",
            "extra": "mean: 4.7223214274192475 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 172.16830714785613,
            "unit": "iter/sec",
            "range": "stddev: 0.0002037821956710758",
            "extra": "mean: 5.808269922414999 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.21450436038918,
            "unit": "iter/sec",
            "range": "stddev: 0.0037456400882331367",
            "extra": "mean: 108.52455659999976 msec\nrounds: 10"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 20.139260587030755,
            "unit": "iter/sec",
            "range": "stddev: 0.03864502287102659",
            "extra": "mean: 49.65425595833336 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.00613384671029,
            "unit": "iter/sec",
            "range": "stddev: 0.02990753524151522",
            "extra": "mean: 30.29739880000122 msec\nrounds: 40"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 108.31055017111115,
            "unit": "iter/sec",
            "range": "stddev: 0.00074126096461721",
            "extra": "mean: 9.232710926314937 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 183.75188572946442,
            "unit": "iter/sec",
            "range": "stddev: 0.0005396315186985371",
            "extra": "mean: 5.4421210211267566 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 194.03939024919816,
            "unit": "iter/sec",
            "range": "stddev: 0.0003286733603714736",
            "extra": "mean: 5.153592776784827 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 163.33149792098425,
            "unit": "iter/sec",
            "range": "stddev: 0.0005065531704838545",
            "extra": "mean: 6.122517779661676 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 144.20632037351493,
            "unit": "iter/sec",
            "range": "stddev: 0.0008372568041122715",
            "extra": "mean: 6.934508816325509 msec\nrounds: 98"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 167.59514954595258,
            "unit": "iter/sec",
            "range": "stddev: 0.0003799978597678522",
            "extra": "mean: 5.9667597941181 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 220.4450223523805,
            "unit": "iter/sec",
            "range": "stddev: 0.0003746728138069371",
            "extra": "mean: 4.53627843046283 msec\nrounds: 151"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 227.6274837329004,
            "unit": "iter/sec",
            "range": "stddev: 0.00014628505316381955",
            "extra": "mean: 4.393142618812264 msec\nrounds: 202"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 160.52424912973032,
            "unit": "iter/sec",
            "range": "stddev: 0.0010011847206493573",
            "extra": "mean: 6.2295883981480795 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 209.16373806641406,
            "unit": "iter/sec",
            "range": "stddev: 0.0006483115632749697",
            "extra": "mean: 4.780943433332971 msec\nrounds: 210"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d7c685f6e1c9eb58c47214c7a54f8cd9c93aad74",
          "message": "Merge pull request #77 from stnkvcmls/claude/multi-user-phase-2-0m1lhs\n\nfeat: Phase 2 — per-user Garmin credentials",
          "timestamp": "2026-06-21T14:48:33+02:00",
          "tree_id": "7ba49be048bff6317d55cf19bc6062d65bcc3dc5",
          "url": "https://github.com/stnkvcmls/running-coach/commit/d7c685f6e1c9eb58c47214c7a54f8cd9c93aad74"
        },
        "date": 1782046169117,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 370.6199470341581,
            "unit": "iter/sec",
            "range": "stddev: 0.00018425402361526828",
            "extra": "mean: 2.698181811320143 msec\nrounds: 53"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 80.72141481822393,
            "unit": "iter/sec",
            "range": "stddev: 0.0004065157799854368",
            "extra": "mean: 12.388286333334145 msec\nrounds: 12"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 91.39376305034322,
            "unit": "iter/sec",
            "range": "stddev: 0.00021295740993092956",
            "extra": "mean: 10.941665674157232 msec\nrounds: 89"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 70.70404998366229,
            "unit": "iter/sec",
            "range": "stddev: 0.01618406169491385",
            "extra": "mean: 14.143461375000044 msec\nrounds: 80"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 140.01303298752188,
            "unit": "iter/sec",
            "range": "stddev: 0.009470206617900373",
            "extra": "mean: 7.14219225641031 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 182.108801303556,
            "unit": "iter/sec",
            "range": "stddev: 0.00007852980941825762",
            "extra": "mean: 5.491222790122627 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 164.8477443272405,
            "unit": "iter/sec",
            "range": "stddev: 0.000936003701079534",
            "extra": "mean: 6.066203720779415 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 249.51633122461254,
            "unit": "iter/sec",
            "range": "stddev: 0.00011128154997118782",
            "extra": "mean: 4.007753701299047 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 161.7105537958466,
            "unit": "iter/sec",
            "range": "stddev: 0.00038318534586536025",
            "extra": "mean: 6.183888290076984 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 220.2307974711214,
            "unit": "iter/sec",
            "range": "stddev: 0.00013499186979850698",
            "extra": "mean: 4.540691000000256 msec\nrounds: 168"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 282.1146361618695,
            "unit": "iter/sec",
            "range": "stddev: 0.00015626974253226512",
            "extra": "mean: 3.5446583474181326 msec\nrounds: 213"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 145.04637703794498,
            "unit": "iter/sec",
            "range": "stddev: 0.00023104365550979505",
            "extra": "mean: 6.89434662499977 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 224.18487785137032,
            "unit": "iter/sec",
            "range": "stddev: 0.00018707279198047603",
            "extra": "mean: 4.4606041655627555 msec\nrounds: 151"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 261.6281729878427,
            "unit": "iter/sec",
            "range": "stddev: 0.0001230401318438301",
            "extra": "mean: 3.822218335968229 msec\nrounds: 253"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 276.39846853980043,
            "unit": "iter/sec",
            "range": "stddev: 0.00010531281657417661",
            "extra": "mean: 3.617965053435176 msec\nrounds: 262"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 237.33716253023036,
            "unit": "iter/sec",
            "range": "stddev: 0.00013303407317226816",
            "extra": "mean: 4.213415165746017 msec\nrounds: 181"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 197.62542604691814,
            "unit": "iter/sec",
            "range": "stddev: 0.00019566567439535033",
            "extra": "mean: 5.060077642856494 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.452828659741616,
            "unit": "iter/sec",
            "range": "stddev: 0.0005810372148894272",
            "extra": "mean: 35.14589048275951 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 207.0681318973641,
            "unit": "iter/sec",
            "range": "stddev: 0.0001224390559091467",
            "extra": "mean: 4.829328351190527 msec\nrounds: 168"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 210.02943102264547,
            "unit": "iter/sec",
            "range": "stddev: 0.0001540460045240001",
            "extra": "mean: 4.761237485294047 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 160.86823734864663,
            "unit": "iter/sec",
            "range": "stddev: 0.00012741827360482968",
            "extra": "mean: 6.216267527272766 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.2989490657456155,
            "unit": "iter/sec",
            "range": "stddev: 0.004582937031279793",
            "extra": "mean: 137.00602524999894 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.281813456406578,
            "unit": "iter/sec",
            "range": "stddev: 0.040160565154053446",
            "extra": "mean: 51.86234180000014 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 30.73341222688074,
            "unit": "iter/sec",
            "range": "stddev: 0.00170221973728146",
            "extra": "mean: 32.5378774285713 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 117.70607763617467,
            "unit": "iter/sec",
            "range": "stddev: 0.000756611986345771",
            "extra": "mean: 8.495738028846436 msec\nrounds: 104"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 206.49598192997746,
            "unit": "iter/sec",
            "range": "stddev: 0.0005180624280698817",
            "extra": "mean: 4.842709241379325 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 206.7779510836643,
            "unit": "iter/sec",
            "range": "stddev: 0.00016270899189017868",
            "extra": "mean: 4.836105565217593 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 181.44244100741696,
            "unit": "iter/sec",
            "range": "stddev: 0.00021833098910845893",
            "extra": "mean: 5.511389697182933 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 159.07294384348964,
            "unit": "iter/sec",
            "range": "stddev: 0.00036195354784944467",
            "extra": "mean: 6.286424176470202 msec\nrounds: 102"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 174.4986934642864,
            "unit": "iter/sec",
            "range": "stddev: 0.00018015835801827104",
            "extra": "mean: 5.730701933333753 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 220.2745313469329,
            "unit": "iter/sec",
            "range": "stddev: 0.00016321804236014834",
            "extra": "mean: 4.539789479451883 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 218.09619084695862,
            "unit": "iter/sec",
            "range": "stddev: 0.00018757794890007627",
            "extra": "mean: 4.585132808219082 msec\nrounds: 219"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 139.04689392428915,
            "unit": "iter/sec",
            "range": "stddev: 0.01598530022345023",
            "extra": "mean: 7.191818326732983 msec\nrounds: 101"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 229.25330608223618,
            "unit": "iter/sec",
            "range": "stddev: 0.00019434855332116507",
            "extra": "mean: 4.361987258065045 msec\nrounds: 217"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "37614c96e741d9163b266e9b6eef7a4ad149784e",
          "message": "Merge pull request #79 from stnkvcmls/claude/multi-user-plan-phase-3-yjkr0y\n\nPhase 3 — multi-user data isolation",
          "timestamp": "2026-06-23T22:25:08+02:00",
          "tree_id": "4d102566c23e9ce9e8fa3356f48ea2bb79582ce1",
          "url": "https://github.com/stnkvcmls/running-coach/commit/37614c96e741d9163b266e9b6eef7a4ad149784e"
        },
        "date": 1782246364149,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 379.49859745616186,
            "unit": "iter/sec",
            "range": "stddev: 0.00018842611132902207",
            "extra": "mean: 2.6350558518612597 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 67.58550708360104,
            "unit": "iter/sec",
            "range": "stddev: 0.0003395721890195655",
            "extra": "mean: 14.796071571424818 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 84.6979743608762,
            "unit": "iter/sec",
            "range": "stddev: 0.009275890862223543",
            "extra": "mean: 11.80665780434439 msec\nrounds: 92"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 81.68093905939833,
            "unit": "iter/sec",
            "range": "stddev: 0.009239433313946475",
            "extra": "mean: 12.242758365850822 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 82.46512527763021,
            "unit": "iter/sec",
            "range": "stddev: 0.0001916012588700987",
            "extra": "mean: 12.126338214285884 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 172.44336462465296,
            "unit": "iter/sec",
            "range": "stddev: 0.00013986123077063968",
            "extra": "mean: 5.799005384617955 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 179.97356290490117,
            "unit": "iter/sec",
            "range": "stddev: 0.00009958476093576079",
            "extra": "mean: 5.556371635140682 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 196.23444308262071,
            "unit": "iter/sec",
            "range": "stddev: 0.00008761457854741837",
            "extra": "mean: 5.0959453615335475 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 141.82377951243907,
            "unit": "iter/sec",
            "range": "stddev: 0.00008305558868781248",
            "extra": "mean: 7.051003741670077 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 167.75080210595667,
            "unit": "iter/sec",
            "range": "stddev: 0.007844487159778946",
            "extra": "mean: 5.961223358970103 msec\nrounds: 156"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 282.73370663372305,
            "unit": "iter/sec",
            "range": "stddev: 0.00014368941169226016",
            "extra": "mean: 3.5368970042736496 msec\nrounds: 234"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 134.04515126916536,
            "unit": "iter/sec",
            "range": "stddev: 0.008716660346060688",
            "extra": "mean: 7.460172863634432 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 214.11320724269714,
            "unit": "iter/sec",
            "range": "stddev: 0.00014365794724802546",
            "extra": "mean: 4.670426513514884 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 259.6168009709905,
            "unit": "iter/sec",
            "range": "stddev: 0.0001067526093279754",
            "extra": "mean: 3.851830837834489 msec\nrounds: 259"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 271.95877669475914,
            "unit": "iter/sec",
            "range": "stddev: 0.00010109786341608308",
            "extra": "mean: 3.6770278648604866 msec\nrounds: 259"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 231.22657102696985,
            "unit": "iter/sec",
            "range": "stddev: 0.00011179155287360377",
            "extra": "mean: 4.324762485377867 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 118.87219764738883,
            "unit": "iter/sec",
            "range": "stddev: 0.00005927438219291099",
            "extra": "mean: 8.412395999999132 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.69229553064952,
            "unit": "iter/sec",
            "range": "stddev: 0.0002388791454450456",
            "extra": "mean: 34.85256168966284 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 166.76913885421644,
            "unit": "iter/sec",
            "range": "stddev: 0.00011130939957507686",
            "extra": "mean: 5.996313267973182 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 205.06196782449175,
            "unit": "iter/sec",
            "range": "stddev: 0.0001244955115413987",
            "extra": "mean: 4.876574679395835 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 166.34194731698466,
            "unit": "iter/sec",
            "range": "stddev: 0.00009133311822113965",
            "extra": "mean: 6.01171271666298 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.119472884549633,
            "unit": "iter/sec",
            "range": "stddev: 0.007639191658679629",
            "extra": "mean: 140.45983687502428 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 22.14704960402797,
            "unit": "iter/sec",
            "range": "stddev: 0.024425188905076382",
            "extra": "mean: 45.15274123999461 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.59857505087833,
            "unit": "iter/sec",
            "range": "stddev: 0.0017874363883600653",
            "extra": "mean: 30.676187484859284 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 126.54831219702689,
            "unit": "iter/sec",
            "range": "stddev: 0.00009403197511083219",
            "extra": "mean: 7.902120404759486 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 208.1046269996766,
            "unit": "iter/sec",
            "range": "stddev: 0.0001679938241896327",
            "extra": "mean: 4.8052751849748825 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 207.27128917989396,
            "unit": "iter/sec",
            "range": "stddev: 0.00024080198202838782",
            "extra": "mean: 4.824594877354598 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 174.24368267215542,
            "unit": "iter/sec",
            "range": "stddev: 0.0001060097084127309",
            "extra": "mean: 5.739088985404017 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 105.34608966320874,
            "unit": "iter/sec",
            "range": "stddev: 0.00014242310174474084",
            "extra": "mean: 9.492521300002668 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 176.46519210316765,
            "unit": "iter/sec",
            "range": "stddev: 0.00010535278721402727",
            "extra": "mean: 5.666839947763553 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 224.47372946066392,
            "unit": "iter/sec",
            "range": "stddev: 0.000088662411841452",
            "extra": "mean: 4.45486428368553 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 223.28878940380528,
            "unit": "iter/sec",
            "range": "stddev: 0.00010696646056737663",
            "extra": "mean: 4.478505180085668 msec\nrounds: 211"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 188.42209889000276,
            "unit": "iter/sec",
            "range": "stddev: 0.00011021323162676212",
            "extra": "mean: 5.307233099997368 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 197.4505111016135,
            "unit": "iter/sec",
            "range": "stddev: 0.00027964041744675126",
            "extra": "mean: 5.0645602000258805 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "6b72a3164246ff9ea29bd7cd913887b455ef8ddc",
          "message": "Merge pull request #80 from stnkvcmls/claude/p2-3-improvement-plan-xg3plq\n\nfeat: P2-3 strength/cross days + Runna-style training plan onboarding & preferences UI",
          "timestamp": "2026-06-24T06:34:03-07:00",
          "tree_id": "c996bc45ecb8d3e7a9d217e13a4baab67457100b",
          "url": "https://github.com/stnkvcmls/running-coach/commit/6b72a3164246ff9ea29bd7cd913887b455ef8ddc"
        },
        "date": 1782308100454,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 414.153192584552,
            "unit": "iter/sec",
            "range": "stddev: 0.00022534446768714556",
            "extra": "mean: 2.414565474575796 msec\nrounds: 59"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 22.866653878648066,
            "unit": "iter/sec",
            "range": "stddev: 0.03600130141041563",
            "extra": "mean: 43.731802882351694 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 25.189682663082934,
            "unit": "iter/sec",
            "range": "stddev: 0.035804502453132166",
            "extra": "mean: 39.69879308823382 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 66.06448619893919,
            "unit": "iter/sec",
            "range": "stddev: 0.023508861687132263",
            "extra": "mean: 15.136725607593648 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 77.07023400703461,
            "unit": "iter/sec",
            "range": "stddev: 0.0003296265083977415",
            "extra": "mean: 12.975177938459671 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 181.15123716245415,
            "unit": "iter/sec",
            "range": "stddev: 0.00010926458154071287",
            "extra": "mean: 5.520249354428712 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 186.88624528348672,
            "unit": "iter/sec",
            "range": "stddev: 0.0001078928416707461",
            "extra": "mean: 5.3508485789476135 msec\nrounds: 152"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 195.3601261850426,
            "unit": "iter/sec",
            "range": "stddev: 0.0001341665351122315",
            "extra": "mean: 5.118751812500433 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 137.77644171366325,
            "unit": "iter/sec",
            "range": "stddev: 0.00016999183494710815",
            "extra": "mean: 7.258134900001778 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 153.49449787437223,
            "unit": "iter/sec",
            "range": "stddev: 0.013721514495690871",
            "extra": "mean: 6.5148915032671155 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 301.7730255657232,
            "unit": "iter/sec",
            "range": "stddev: 0.000143119253356333",
            "extra": "mean: 3.313748795556977 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 153.23524213688154,
            "unit": "iter/sec",
            "range": "stddev: 0.00018307444905965085",
            "extra": "mean: 6.52591392198619 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 235.2741889432578,
            "unit": "iter/sec",
            "range": "stddev: 0.00012164218441849999",
            "extra": "mean: 4.2503599927027045 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 229.37245986738395,
            "unit": "iter/sec",
            "range": "stddev: 0.011237289233440344",
            "extra": "mean: 4.35972130472058 msec\nrounds: 233"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 290.5022170578825,
            "unit": "iter/sec",
            "range": "stddev: 0.00011986901584253765",
            "extra": "mean: 3.4423145204456405 msec\nrounds: 269"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 245.48861144345022,
            "unit": "iter/sec",
            "range": "stddev: 0.00017069235937167756",
            "extra": "mean: 4.073508722543554 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 110.34722724318306,
            "unit": "iter/sec",
            "range": "stddev: 0.00039034836011058105",
            "extra": "mean: 9.062302923082983 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.459280660675653,
            "unit": "iter/sec",
            "range": "stddev: 0.0004778030029574698",
            "extra": "mean: 36.417559962963516 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 157.29387128362347,
            "unit": "iter/sec",
            "range": "stddev: 0.0003420955183467832",
            "extra": "mean: 6.357526786258926 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 209.02296240771926,
            "unit": "iter/sec",
            "range": "stddev: 0.0001643282378232744",
            "extra": "mean: 4.78416336885229 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 114.3394291095687,
            "unit": "iter/sec",
            "range": "stddev: 0.00038478518716961326",
            "extra": "mean: 8.745889390804324 msec\nrounds: 87"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.295976505437744,
            "unit": "iter/sec",
            "range": "stddev: 0.07092252120517348",
            "extra": "mean: 137.0618448750065 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 17.642736310677247,
            "unit": "iter/sec",
            "range": "stddev: 0.04328226985605242",
            "extra": "mean: 56.68055013636449 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 39.64502513105607,
            "unit": "iter/sec",
            "range": "stddev: 0.0006292727008094665",
            "extra": "mean: 25.223845783784014 msec\nrounds: 37"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 124.37546845070581,
            "unit": "iter/sec",
            "range": "stddev: 0.00028389988024570467",
            "extra": "mean: 8.040170722221914 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 223.41159874145265,
            "unit": "iter/sec",
            "range": "stddev: 0.0002033462079438038",
            "extra": "mean: 4.476043346152628 msec\nrounds: 182"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 217.9011046754652,
            "unit": "iter/sec",
            "range": "stddev: 0.00014947696915881565",
            "extra": "mean: 4.589237863155248 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 184.08570986154555,
            "unit": "iter/sec",
            "range": "stddev: 0.00014897374804745517",
            "extra": "mean: 5.432252187049823 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 94.17114833482908,
            "unit": "iter/sec",
            "range": "stddev: 0.000804443197003898",
            "extra": "mean: 10.618963638889293 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 186.78667529163465,
            "unit": "iter/sec",
            "range": "stddev: 0.0001484346574186857",
            "extra": "mean: 5.353700944880973 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 234.5511149035046,
            "unit": "iter/sec",
            "range": "stddev: 0.00013409726132737216",
            "extra": "mean: 4.26346300000068 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 231.41613258539638,
            "unit": "iter/sec",
            "range": "stddev: 0.00015047218730341767",
            "extra": "mean: 4.321219911628172 msec\nrounds: 215"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 195.9685229605287,
            "unit": "iter/sec",
            "range": "stddev: 0.0001577218353826654",
            "extra": "mean: 5.102860321100733 msec\nrounds: 109"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 176.28402995726134,
            "unit": "iter/sec",
            "range": "stddev: 0.0009763293409936908",
            "extra": "mean: 5.67266360000076 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "66125a17c641803de80d493c5ecfd99ca5332d81",
          "message": "Merge pull request #78 from stnkvcmls/claude/route-display-animation-3wf86b\n\nfeat: animated route silhouette on activity detail",
          "timestamp": "2026-06-24T07:04:23-07:00",
          "tree_id": "d17c08d2ef2202e46cb086c233406ce443d8b21e",
          "url": "https://github.com/stnkvcmls/running-coach/commit/66125a17c641803de80d493c5ecfd99ca5332d81"
        },
        "date": 1782309922858,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 397.2018896858455,
            "unit": "iter/sec",
            "range": "stddev: 0.00018972370976385488",
            "extra": "mean: 2.5176113859652554 msec\nrounds: 57"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 26.543047637224685,
            "unit": "iter/sec",
            "range": "stddev: 0.022240601262530465",
            "extra": "mean: 37.67464888235265 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 29.784999463456206,
            "unit": "iter/sec",
            "range": "stddev: 0.021834537869720276",
            "extra": "mean: 33.573947222222365 msec\nrounds: 36"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 75.90195879690943,
            "unit": "iter/sec",
            "range": "stddev: 0.014080209069561107",
            "extra": "mean: 13.174890554217395 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 83.69735078771744,
            "unit": "iter/sec",
            "range": "stddev: 0.00014932302599836848",
            "extra": "mean: 11.947809465753721 msec\nrounds: 73"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 177.79889121319658,
            "unit": "iter/sec",
            "range": "stddev: 0.00024148571120418135",
            "extra": "mean: 5.624332037036787 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 186.2720665376132,
            "unit": "iter/sec",
            "range": "stddev: 0.00008703481985311398",
            "extra": "mean: 5.368491468354832 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 201.75328295520083,
            "unit": "iter/sec",
            "range": "stddev: 0.00011728391830320324",
            "extra": "mean: 4.956548837037013 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 144.78257469490046,
            "unit": "iter/sec",
            "range": "stddev: 0.00009892922908303279",
            "extra": "mean: 6.906908528925491 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 192.95566562501293,
            "unit": "iter/sec",
            "range": "stddev: 0.00017314828338061975",
            "extra": "mean: 5.182537640244182 msec\nrounds: 164"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 260.791352490128,
            "unit": "iter/sec",
            "range": "stddev: 0.006714746180261205",
            "extra": "mean: 3.8344829705879686 msec\nrounds: 238"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 153.68582814386284,
            "unit": "iter/sec",
            "range": "stddev: 0.00008601190626184705",
            "extra": "mean: 6.5067808273376775 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 225.08123781268506,
            "unit": "iter/sec",
            "range": "stddev: 0.00010195710963371965",
            "extra": "mean: 4.442840326087999 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 269.2606360347452,
            "unit": "iter/sec",
            "range": "stddev: 0.00009827732091383069",
            "extra": "mean: 3.7138737200002776 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 281.9740673080727,
            "unit": "iter/sec",
            "range": "stddev: 0.00009918925751891826",
            "extra": "mean: 3.5464254197086973 msec\nrounds: 274"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 240.45648732587196,
            "unit": "iter/sec",
            "range": "stddev: 0.00012493052924036685",
            "extra": "mean: 4.158756584698744 msec\nrounds: 183"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 122.52137186229564,
            "unit": "iter/sec",
            "range": "stddev: 0.000246650854402923",
            "extra": "mean: 8.161841357146418 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.702878564677153,
            "unit": "iter/sec",
            "range": "stddev: 0.0005580691371203368",
            "extra": "mean: 34.83971120689748 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 172.82907144793816,
            "unit": "iter/sec",
            "range": "stddev: 0.0000888114215057369",
            "extra": "mean: 5.786063603895674 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 179.96932074987677,
            "unit": "iter/sec",
            "range": "stddev: 0.009942958733598939",
            "extra": "mean: 5.556502607407238 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 137.907849158447,
            "unit": "iter/sec",
            "range": "stddev: 0.00012930625531461508",
            "extra": "mean: 7.251218883495646 msec\nrounds: 103"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.605670237458929,
            "unit": "iter/sec",
            "range": "stddev: 0.008067893992512662",
            "extra": "mean: 131.4808516249979 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 22.17668109342321,
            "unit": "iter/sec",
            "range": "stddev: 0.02621281558617456",
            "extra": "mean: 45.09241016666662 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 35.13908153890316,
            "unit": "iter/sec",
            "range": "stddev: 0.0010731977652788354",
            "extra": "mean: 28.458342000000208 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 115.5551442867258,
            "unit": "iter/sec",
            "range": "stddev: 0.010927778466425762",
            "extra": "mean: 8.653876953489066 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 216.70842268810566,
            "unit": "iter/sec",
            "range": "stddev: 0.00010316123568654395",
            "extra": "mean: 4.614495309391989 msec\nrounds: 181"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 215.09289790193452,
            "unit": "iter/sec",
            "range": "stddev: 0.00009666073891760969",
            "extra": "mean: 4.649153969072105 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 180.4308093293943,
            "unit": "iter/sec",
            "range": "stddev: 0.00010074766042946204",
            "extra": "mean: 5.542290719177572 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 108.05665376622956,
            "unit": "iter/sec",
            "range": "stddev: 0.00011995588522858665",
            "extra": "mean: 9.25440465853594 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 181.9622275766987,
            "unit": "iter/sec",
            "range": "stddev: 0.00014656016261167188",
            "extra": "mean: 5.495646065216976 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 231.86964453197083,
            "unit": "iter/sec",
            "range": "stddev: 0.00008926366064181559",
            "extra": "mean: 4.312768072847574 msec\nrounds: 151"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 227.69207783327477,
            "unit": "iter/sec",
            "range": "stddev: 0.0002481983544725078",
            "extra": "mean: 4.391896325581604 msec\nrounds: 215"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 194.2108399031289,
            "unit": "iter/sec",
            "range": "stddev: 0.00013058547030354682",
            "extra": "mean: 5.1490431764714755 msec\nrounds: 68"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 206.0736195650391,
            "unit": "iter/sec",
            "range": "stddev: 0.00026485115020454377",
            "extra": "mean: 4.852634714286604 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "496538a6061b5097f42d4f061bb07e478b360eab",
          "message": "Merge pull request #81 from stnkvcmls/claude/p3-2-implementation-oof4vr\n\nP3-2: Move AI model catalog to config",
          "timestamp": "2026-06-24T07:28:16-07:00",
          "tree_id": "0df776d4523c43b779546489e08346a56bdd3d87",
          "url": "https://github.com/stnkvcmls/running-coach/commit/496538a6061b5097f42d4f061bb07e478b360eab"
        },
        "date": 1782311353096,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 378.72100222693757,
            "unit": "iter/sec",
            "range": "stddev: 0.000174471273573837",
            "extra": "mean: 2.6404661851860514 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 22.169993571758262,
            "unit": "iter/sec",
            "range": "stddev: 0.03204075498592134",
            "extra": "mean: 45.10601217647046 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 31.265518627957984,
            "unit": "iter/sec",
            "range": "stddev: 0.017459182348383652",
            "extra": "mean: 31.984116812499906 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 73.73246829122309,
            "unit": "iter/sec",
            "range": "stddev: 0.015360501757212834",
            "extra": "mean: 13.562546096385564 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 70.94251911704468,
            "unit": "iter/sec",
            "range": "stddev: 0.011628316260080223",
            "extra": "mean: 14.095918955882404 msec\nrounds: 68"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 171.84784593578715,
            "unit": "iter/sec",
            "range": "stddev: 0.00012010733709343088",
            "extra": "mean: 5.819101162162143 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 180.2019754778282,
            "unit": "iter/sec",
            "range": "stddev: 0.00009051257174027802",
            "extra": "mean: 5.549328731543449 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 193.5670518963797,
            "unit": "iter/sec",
            "range": "stddev: 0.00034238283634416495",
            "extra": "mean: 5.1661684682541935 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 137.17602352128716,
            "unit": "iter/sec",
            "range": "stddev: 0.000878979182403481",
            "extra": "mean: 7.289903689654764 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 186.4543765231996,
            "unit": "iter/sec",
            "range": "stddev: 0.000129595426355756",
            "extra": "mean: 5.363242304347707 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 282.6866335915304,
            "unit": "iter/sec",
            "range": "stddev: 0.0001163152556448988",
            "extra": "mean: 3.537485969163139 msec\nrounds: 227"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 135.2527316409658,
            "unit": "iter/sec",
            "range": "stddev: 0.008980606788871056",
            "extra": "mean: 7.393566014286077 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 217.29411819357824,
            "unit": "iter/sec",
            "range": "stddev: 0.00018434526719570272",
            "extra": "mean: 4.602057378788053 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 257.86788257848764,
            "unit": "iter/sec",
            "range": "stddev: 0.0001675322625383881",
            "extra": "mean: 3.8779548271027067 msec\nrounds: 214"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 273.7244844782654,
            "unit": "iter/sec",
            "range": "stddev: 0.00009925085698672453",
            "extra": "mean: 3.65330855186761 msec\nrounds: 241"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 233.2172659587634,
            "unit": "iter/sec",
            "range": "stddev: 0.00010533177922872919",
            "extra": "mean: 4.287847196428485 msec\nrounds: 168"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 57.05084103252779,
            "unit": "iter/sec",
            "range": "stddev: 0.03240957193853772",
            "extra": "mean: 17.528225384615197 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.61299197270922,
            "unit": "iter/sec",
            "range": "stddev: 0.0009149136275124589",
            "extra": "mean: 34.94915879310314 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 164.5967679409984,
            "unit": "iter/sec",
            "range": "stddev: 0.00016984306499585373",
            "extra": "mean: 6.075453439999876 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 205.27156292795644,
            "unit": "iter/sec",
            "range": "stddev: 0.00015049928591945633",
            "extra": "mean: 4.871595391666439 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 132.7320318684764,
            "unit": "iter/sec",
            "range": "stddev: 0.00020645212753263493",
            "extra": "mean: 7.533976432990159 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.9944882960100125,
            "unit": "iter/sec",
            "range": "stddev: 0.009012497411385097",
            "extra": "mean: 142.96971524999867 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.306392172402678,
            "unit": "iter/sec",
            "range": "stddev: 0.02812185960110726",
            "extra": "mean: 46.93427173912908 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 29.397507374140584,
            "unit": "iter/sec",
            "range": "stddev: 0.022701849927438775",
            "extra": "mean: 34.01648946875157 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 127.9452874431883,
            "unit": "iter/sec",
            "range": "stddev: 0.0001365631382191417",
            "extra": "mean: 7.8158408174590335 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 212.36101711745079,
            "unit": "iter/sec",
            "range": "stddev: 0.00010241842781878115",
            "extra": "mean: 4.708962188888598 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 210.25613171576964,
            "unit": "iter/sec",
            "range": "stddev: 0.00013063318947052486",
            "extra": "mean: 4.756103861702493 msec\nrounds: 94"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 174.49617465282705,
            "unit": "iter/sec",
            "range": "stddev: 0.0003586362375775523",
            "extra": "mean: 5.7307846546755155 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 106.43899395644407,
            "unit": "iter/sec",
            "range": "stddev: 0.00015167249006330574",
            "extra": "mean: 9.39505309876576 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 176.2996421554174,
            "unit": "iter/sec",
            "range": "stddev: 0.00013039377497325795",
            "extra": "mean: 5.672161257811559 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 223.8656516732629,
            "unit": "iter/sec",
            "range": "stddev: 0.0001404042212860554",
            "extra": "mean: 4.466964862745104 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 221.55604482580438,
            "unit": "iter/sec",
            "range": "stddev: 0.00018908824622979243",
            "extra": "mean: 4.513530654450152 msec\nrounds: 191"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 185.14558567301307,
            "unit": "iter/sec",
            "range": "stddev: 0.00022049995942175453",
            "extra": "mean: 5.401154968750414 msec\nrounds: 96"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 195.00691806538526,
            "unit": "iter/sec",
            "range": "stddev: 0.0005317639802475778",
            "extra": "mean: 5.128023200001053 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9254a809a187c387c7094d7cb71c3f9c80cb4827",
          "message": "Merge pull request #82 from stnkvcmls/claude/training-stats-help-icons-kp3ibj\n\nAdd help icons and explainer pages for training stats",
          "timestamp": "2026-06-24T13:06:39-07:00",
          "tree_id": "e984158724fd3a332b1eca3217d003f2e956c364",
          "url": "https://github.com/stnkvcmls/running-coach/commit/9254a809a187c387c7094d7cb71c3f9c80cb4827"
        },
        "date": 1782331664308,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 345.9640582552204,
            "unit": "iter/sec",
            "range": "stddev: 0.00030961251060157444",
            "extra": "mean: 2.8904736666671087 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 23.057289389604442,
            "unit": "iter/sec",
            "range": "stddev: 0.03222518199321218",
            "extra": "mean: 43.37023242857236 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 26.65176431044264,
            "unit": "iter/sec",
            "range": "stddev: 0.025789009793738493",
            "extra": "mean: 37.520968156250056 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 67.79847653037187,
            "unit": "iter/sec",
            "range": "stddev: 0.019005201311024504",
            "extra": "mean: 14.749593961038745 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 77.1961831328264,
            "unit": "iter/sec",
            "range": "stddev: 0.0007672727432262482",
            "extra": "mean: 12.954008338461055 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 173.0690505098626,
            "unit": "iter/sec",
            "range": "stddev: 0.00011971589001971175",
            "extra": "mean: 5.778040597403137 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 179.80891828523113,
            "unit": "iter/sec",
            "range": "stddev: 0.00012278425044038078",
            "extra": "mean: 5.561459406666908 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 163.500008743344,
            "unit": "iter/sec",
            "range": "stddev: 0.010340892652981663",
            "extra": "mean: 6.116207623999344 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 140.2716791395682,
            "unit": "iter/sec",
            "range": "stddev: 0.0000806392596862011",
            "extra": "mean: 7.129022808695511 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 185.24094148179935,
            "unit": "iter/sec",
            "range": "stddev: 0.00017033407731217572",
            "extra": "mean: 5.3983746357619 msec\nrounds: 151"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 285.27400189828364,
            "unit": "iter/sec",
            "range": "stddev: 0.00010426614560141651",
            "extra": "mean: 3.5054018008853 msec\nrounds: 226"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 134.1661497142882,
            "unit": "iter/sec",
            "range": "stddev: 0.009292344157476536",
            "extra": "mean: 7.453444867647593 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 218.96741463290894,
            "unit": "iter/sec",
            "range": "stddev: 0.00012425026492866043",
            "extra": "mean: 4.566889560606377 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 259.6621100798462,
            "unit": "iter/sec",
            "range": "stddev: 0.00012520130168512203",
            "extra": "mean: 3.851158721973335 msec\nrounds: 223"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 272.50231289092767,
            "unit": "iter/sec",
            "range": "stddev: 0.00014361602093663546",
            "extra": "mean: 3.669693623482242 msec\nrounds: 247"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 234.2644561423724,
            "unit": "iter/sec",
            "range": "stddev: 0.00010091964605171713",
            "extra": "mean: 4.268680005780552 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 116.95394844711569,
            "unit": "iter/sec",
            "range": "stddev: 0.000252871512601698",
            "extra": "mean: 8.550374000003776 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.893713175864224,
            "unit": "iter/sec",
            "range": "stddev: 0.0004938120150886151",
            "extra": "mean: 34.60960500000151 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 167.54625150393434,
            "unit": "iter/sec",
            "range": "stddev: 0.00010650782171792924",
            "extra": "mean: 5.968501181159031 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 207.69341992128565,
            "unit": "iter/sec",
            "range": "stddev: 0.00011556389130894544",
            "extra": "mean: 4.814789030769454 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 113.52713102713268,
            "unit": "iter/sec",
            "range": "stddev: 0.013278149609909399",
            "extra": "mean: 8.808467112244761 msec\nrounds: 98"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.213511180967666,
            "unit": "iter/sec",
            "range": "stddev: 0.005633190817910222",
            "extra": "mean: 138.628744714284 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.455472219681347,
            "unit": "iter/sec",
            "range": "stddev: 0.02764863387908226",
            "extra": "mean: 46.608156173914864 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.378344582822876,
            "unit": "iter/sec",
            "range": "stddev: 0.001608624825001901",
            "extra": "mean: 30.884840250001933 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 127.38278329543765,
            "unit": "iter/sec",
            "range": "stddev: 0.00008717464199610716",
            "extra": "mean: 7.850354452380819 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 210.38605850102164,
            "unit": "iter/sec",
            "range": "stddev: 0.00014597451788346763",
            "extra": "mean: 4.753166664772818 msec\nrounds: 176"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 210.39449762882344,
            "unit": "iter/sec",
            "range": "stddev: 0.00012576142756767",
            "extra": "mean: 4.752976010637851 msec\nrounds: 94"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 177.62565093009087,
            "unit": "iter/sec",
            "range": "stddev: 0.00010590988745763892",
            "extra": "mean: 5.629817510949337 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 86.30339823529603,
            "unit": "iter/sec",
            "range": "stddev: 0.01643406549028379",
            "extra": "mean: 11.587029253165884 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 177.69111307760258,
            "unit": "iter/sec",
            "range": "stddev: 0.00012203292043491756",
            "extra": "mean: 5.627743462686694 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 225.87919063250806,
            "unit": "iter/sec",
            "range": "stddev: 0.00010374083815667688",
            "extra": "mean: 4.4271453124999915 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 225.80656245907778,
            "unit": "iter/sec",
            "range": "stddev: 0.00012032331625697991",
            "extra": "mean: 4.428569254630175 msec\nrounds: 216"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 182.09420831222357,
            "unit": "iter/sec",
            "range": "stddev: 0.0005304862263149936",
            "extra": "mean: 5.4916628555553695 msec\nrounds: 90"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 200.3605769085483,
            "unit": "iter/sec",
            "range": "stddev: 0.00012487396875066666",
            "extra": "mean: 4.991001800001982 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "203a947ab18e951a258c04328d1e42fb696db6d7",
          "message": "Merge pull request #83 from stnkvcmls/claude/p1-3-improvements-3t851k\n\nfeat(p1-3): push structured workouts to Garmin device",
          "timestamp": "2026-06-24T17:14:03-07:00",
          "tree_id": "ffcf1bf9bd20a6e1e16c08d93d2a9b1cf7c6ae63",
          "url": "https://github.com/stnkvcmls/running-coach/commit/203a947ab18e951a258c04328d1e42fb696db6d7"
        },
        "date": 1782346506043,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 379.0698625194557,
            "unit": "iter/sec",
            "range": "stddev: 0.0001971292469465891",
            "extra": "mean: 2.6380361481484833 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 24.76905093639397,
            "unit": "iter/sec",
            "range": "stddev: 0.026339381081559043",
            "extra": "mean: 40.37296392857215 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 28.521281375977924,
            "unit": "iter/sec",
            "range": "stddev: 0.025478305468658705",
            "extra": "mean: 35.06153832352886 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 73.22769535292834,
            "unit": "iter/sec",
            "range": "stddev: 0.016674929277386657",
            "extra": "mean: 13.656035399999933 msec\nrounds: 80"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 81.33700988119854,
            "unit": "iter/sec",
            "range": "stddev: 0.0004322011505264981",
            "extra": "mean: 12.294526212121735 msec\nrounds: 66"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 174.60280964193151,
            "unit": "iter/sec",
            "range": "stddev: 0.0000981151089521607",
            "extra": "mean: 5.727284698629765 msec\nrounds: 73"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 180.99116647420328,
            "unit": "iter/sec",
            "range": "stddev: 0.00012669814360332597",
            "extra": "mean: 5.52513152702693 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 196.84571939299045,
            "unit": "iter/sec",
            "range": "stddev: 0.00013030722496870585",
            "extra": "mean: 5.080120629921147 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 141.66845507279734,
            "unit": "iter/sec",
            "range": "stddev: 0.00012196951173964192",
            "extra": "mean: 7.058734419642982 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 163.78703166180992,
            "unit": "iter/sec",
            "range": "stddev: 0.010061723791976944",
            "extra": "mean: 6.105489487499938 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 285.086928321472,
            "unit": "iter/sec",
            "range": "stddev: 0.00011322947094893982",
            "extra": "mean: 3.5077020398226466 msec\nrounds: 226"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 149.49208456945468,
            "unit": "iter/sec",
            "range": "stddev: 0.00016100635132021258",
            "extra": "mean: 6.6893173834591595 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 215.68913945812966,
            "unit": "iter/sec",
            "range": "stddev: 0.00037798649066163813",
            "extra": "mean: 4.636302052631275 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 226.4528350545928,
            "unit": "iter/sec",
            "range": "stddev: 0.008510694477936747",
            "extra": "mean: 4.415930583332825 msec\nrounds: 204"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 273.4049259554591,
            "unit": "iter/sec",
            "range": "stddev: 0.00011670724342662275",
            "extra": "mean: 3.6575785769233433 msec\nrounds: 260"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 235.22394368368873,
            "unit": "iter/sec",
            "range": "stddev: 0.00011319459866145416",
            "extra": "mean: 4.25126789534965 msec\nrounds: 172"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 117.94356467563614,
            "unit": "iter/sec",
            "range": "stddev: 0.00037390218513173894",
            "extra": "mean: 8.478631307695013 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.81054252164158,
            "unit": "iter/sec",
            "range": "stddev: 0.0008688103593809442",
            "extra": "mean: 34.70951646428842 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 167.8982383269972,
            "unit": "iter/sec",
            "range": "stddev: 0.00020953231061747972",
            "extra": "mean: 5.955988639097025 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 210.59841001991472,
            "unit": "iter/sec",
            "range": "stddev: 0.00011340093685082605",
            "extra": "mean: 4.748373930769171 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 114.8960101329121,
            "unit": "iter/sec",
            "range": "stddev: 0.00029580670205373125",
            "extra": "mean: 8.70352241860441 msec\nrounds: 86"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.94741418831872,
            "unit": "iter/sec",
            "range": "stddev: 0.009559062504638548",
            "extra": "mean: 143.93844571428968 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.215270561734656,
            "unit": "iter/sec",
            "range": "stddev: 0.02796260502114583",
            "extra": "mean: 47.13585891304493 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.781036053824174,
            "unit": "iter/sec",
            "range": "stddev: 0.0017439841574037774",
            "extra": "mean: 30.505442181817244 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 113.90263223799943,
            "unit": "iter/sec",
            "range": "stddev: 0.011735925161743628",
            "extra": "mean: 8.779428362204142 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 214.77812390306457,
            "unit": "iter/sec",
            "range": "stddev: 0.00012350498236126056",
            "extra": "mean: 4.655967664804299 msec\nrounds: 179"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 212.74294996114224,
            "unit": "iter/sec",
            "range": "stddev: 0.00011087513818961879",
            "extra": "mean: 4.700508290322435 msec\nrounds: 93"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 177.81676254242223,
            "unit": "iter/sec",
            "range": "stddev: 0.00016024536318762157",
            "extra": "mean: 5.62376676811573 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 107.70494748177813,
            "unit": "iter/sec",
            "range": "stddev: 0.00026647890865205286",
            "extra": "mean: 9.284624554217281 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 179.73292023378175,
            "unit": "iter/sec",
            "range": "stddev: 0.0001568435383699318",
            "extra": "mean: 5.563811007461974 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 227.4237453290768,
            "unit": "iter/sec",
            "range": "stddev: 0.00013551279722975225",
            "extra": "mean: 4.397078231883937 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 224.85400245017655,
            "unit": "iter/sec",
            "range": "stddev: 0.0001342317389166819",
            "extra": "mean: 4.447330219178915 msec\nrounds: 219"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 187.33306096098417,
            "unit": "iter/sec",
            "range": "stddev: 0.0001595379888723134",
            "extra": "mean: 5.338086053098069 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 183.7561476536912,
            "unit": "iter/sec",
            "range": "stddev: 0.0008494016280634115",
            "extra": "mean: 5.441994800003158 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "6ecf58aa0fc303bd5dc06143421a95b329b91c20",
          "message": "Merge pull request #84 from stnkvcmls/claude/codebase-state-docs-z9w4il\n\ndocs: refresh CURRENT_STATE.md to reflect current codebase",
          "timestamp": "2026-06-25T06:09:23-07:00",
          "tree_id": "b72591aff3e46fe2ed1d6cac576474102def3339",
          "url": "https://github.com/stnkvcmls/running-coach/commit/6ecf58aa0fc303bd5dc06143421a95b329b91c20"
        },
        "date": 1782393026237,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 294.87707177158586,
            "unit": "iter/sec",
            "range": "stddev: 0.0006956026982702224",
            "extra": "mean: 3.391243659576924 msec\nrounds: 47"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 15.729993709974137,
            "unit": "iter/sec",
            "range": "stddev: 0.05186762577541006",
            "extra": "mean: 63.57281626666615 msec\nrounds: 15"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 24.21652297821921,
            "unit": "iter/sec",
            "range": "stddev: 0.027534774470333846",
            "extra": "mean: 41.294119758621775 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 58.12547446884364,
            "unit": "iter/sec",
            "range": "stddev: 0.01865637585490158",
            "extra": "mean: 17.20416063934272 msec\nrounds: 61"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 62.44564482711567,
            "unit": "iter/sec",
            "range": "stddev: 0.0005944154627735321",
            "extra": "mean: 16.013927036361896 msec\nrounds: 55"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 129.84746091619505,
            "unit": "iter/sec",
            "range": "stddev: 0.0010954187891217574",
            "extra": "mean: 7.701344276923605 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 131.3594047170253,
            "unit": "iter/sec",
            "range": "stddev: 0.0010607387113299976",
            "extra": "mean: 7.612701977100169 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 132.2826441316594,
            "unit": "iter/sec",
            "range": "stddev: 0.0010977552480471349",
            "extra": "mean: 7.55957069473688 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 78.41418132605634,
            "unit": "iter/sec",
            "range": "stddev: 0.0016728078107478247",
            "extra": "mean: 12.752795260870865 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 105.04375664345274,
            "unit": "iter/sec",
            "range": "stddev: 0.0022168399343407887",
            "extra": "mean: 9.519842320512906 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 152.7938029925179,
            "unit": "iter/sec",
            "range": "stddev: 0.001333367528258768",
            "extra": "mean: 6.544768049584895 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 83.11047558571555,
            "unit": "iter/sec",
            "range": "stddev: 0.018456360009415657",
            "extra": "mean: 12.032177567900634 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 112.09183538194651,
            "unit": "iter/sec",
            "range": "stddev: 0.0017391715445414908",
            "extra": "mean: 8.921256366197923 msec\nrounds: 71"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 157.54055812488224,
            "unit": "iter/sec",
            "range": "stddev: 0.001202313487184857",
            "extra": "mean: 6.347571773912982 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 170.2841631810751,
            "unit": "iter/sec",
            "range": "stddev: 0.0012979944079847031",
            "extra": "mean: 5.872536713450152 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 131.57602635794333,
            "unit": "iter/sec",
            "range": "stddev: 0.0010083430596903962",
            "extra": "mean: 7.600168721310752 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 76.5754676747541,
            "unit": "iter/sec",
            "range": "stddev: 0.0007995308210521367",
            "extra": "mean: 13.059012636362738 msec\nrounds: 11"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 26.088901113391977,
            "unit": "iter/sec",
            "range": "stddev: 0.0007967885446891732",
            "extra": "mean: 38.330476076919894 msec\nrounds: 26"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 115.41103070974145,
            "unit": "iter/sec",
            "range": "stddev: 0.0010879694716224866",
            "extra": "mean: 8.664683036364162 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 148.33347446244153,
            "unit": "iter/sec",
            "range": "stddev: 0.0010474199040612273",
            "extra": "mean: 6.741566619564371 msec\nrounds: 92"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 74.3309076140691,
            "unit": "iter/sec",
            "range": "stddev: 0.0015512418028300772",
            "extra": "mean: 13.453353821428696 msec\nrounds: 56"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 5.44194465149393,
            "unit": "iter/sec",
            "range": "stddev: 0.08257584446847446",
            "extra": "mean: 183.75784099999595 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 15.779121832856395,
            "unit": "iter/sec",
            "range": "stddev: 0.04927172133267852",
            "extra": "mean: 63.37488299999876 msec\nrounds: 20"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 28.147313156231572,
            "unit": "iter/sec",
            "range": "stddev: 0.0018897569245448905",
            "extra": "mean: 35.52736967999408 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 94.02711864853487,
            "unit": "iter/sec",
            "range": "stddev: 0.0011972141712752128",
            "extra": "mean: 10.6352296483519 msec\nrounds: 91"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 153.55362777311586,
            "unit": "iter/sec",
            "range": "stddev: 0.0016217689360091294",
            "extra": "mean: 6.512382771428602 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 181.21624606183636,
            "unit": "iter/sec",
            "range": "stddev: 0.0010558710404236183",
            "extra": "mean: 5.51826903896227 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 128.32235070677226,
            "unit": "iter/sec",
            "range": "stddev: 0.0013990086505212404",
            "extra": "mean: 7.792874697916711 msec\nrounds: 96"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 75.10143222544087,
            "unit": "iter/sec",
            "range": "stddev: 0.0011560058827526096",
            "extra": "mean: 13.315325292308426 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 142.18860671320343,
            "unit": "iter/sec",
            "range": "stddev: 0.0012616548957590493",
            "extra": "mean: 7.032912292452624 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 177.70201585897843,
            "unit": "iter/sec",
            "range": "stddev: 0.0011822496861262552",
            "extra": "mean: 5.627398176470797 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 137.29094663699706,
            "unit": "iter/sec",
            "range": "stddev: 0.016044713704341247",
            "extra": "mean: 7.283801477777274 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 149.65169420843276,
            "unit": "iter/sec",
            "range": "stddev: 0.0017524952740247232",
            "extra": "mean: 6.682182953486742 msec\nrounds: 86"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 185.53437265443998,
            "unit": "iter/sec",
            "range": "stddev: 0.0007128413783734337",
            "extra": "mean: 5.389836857144052 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "2dc77853fca92175d2e0d1151450528a435af3af",
          "message": "Merge pull request #85 from stnkvcmls/claude/running-coach-research-3cy0f3\n\ndocs: v3 improvement plan — conversational coach & execution focus",
          "timestamp": "2026-06-25T06:59:52-07:00",
          "tree_id": "4fb07a4e200f6432cdee9e9786ba35fc24585309",
          "url": "https://github.com/stnkvcmls/running-coach/commit/2dc77853fca92175d2e0d1151450528a435af3af"
        },
        "date": 1782396050369,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 387.0569142678623,
            "unit": "iter/sec",
            "range": "stddev: 0.0001956436631718797",
            "extra": "mean: 2.5835993703705062 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 21.162523650365284,
            "unit": "iter/sec",
            "range": "stddev: 0.036091345479969554",
            "extra": "mean: 47.253343529411204 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 29.56800390959928,
            "unit": "iter/sec",
            "range": "stddev: 0.018796322723987915",
            "extra": "mean: 33.820341848485384 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 88.38300284114078,
            "unit": "iter/sec",
            "range": "stddev: 0.00032420805516886935",
            "extra": "mean: 11.314392675675386 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 77.28549237698508,
            "unit": "iter/sec",
            "range": "stddev: 0.0003285778634325469",
            "extra": "mean: 12.939038999999838 msec\nrounds: 67"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 174.21517340748295,
            "unit": "iter/sec",
            "range": "stddev: 0.00015445978909234888",
            "extra": "mean: 5.740028152777693 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 182.01074406133225,
            "unit": "iter/sec",
            "range": "stddev: 0.00010246576706053148",
            "extra": "mean: 5.494181154839022 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 191.48052456635054,
            "unit": "iter/sec",
            "range": "stddev: 0.0003982081788450556",
            "extra": "mean: 5.222463236220594 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 139.967807404293,
            "unit": "iter/sec",
            "range": "stddev: 0.00023415803272264777",
            "extra": "mean: 7.144500000000203 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 163.98073527194387,
            "unit": "iter/sec",
            "range": "stddev: 0.009254439671516465",
            "extra": "mean: 6.098277327160479 msec\nrounds: 162"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 287.499657862679,
            "unit": "iter/sec",
            "range": "stddev: 0.00013065115700938043",
            "extra": "mean: 3.4782650088496414 msec\nrounds: 226"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 133.5811787787315,
            "unit": "iter/sec",
            "range": "stddev: 0.010070848390101235",
            "extra": "mean: 7.48608456028401 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 217.67496865232258,
            "unit": "iter/sec",
            "range": "stddev: 0.0001363824760856315",
            "extra": "mean: 4.594005485294141 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 262.1636763119975,
            "unit": "iter/sec",
            "range": "stddev: 0.00011786634838264665",
            "extra": "mean: 3.8144109590907376 msec\nrounds: 220"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 276.3377104035863,
            "unit": "iter/sec",
            "range": "stddev: 0.00011636963727401264",
            "extra": "mean: 3.618760532319378 msec\nrounds: 263"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 234.76133845886184,
            "unit": "iter/sec",
            "range": "stddev: 0.0001142855941134235",
            "extra": "mean: 4.259645163742469 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 114.92391532908256,
            "unit": "iter/sec",
            "range": "stddev: 0.00035933436018629393",
            "extra": "mean: 8.701409076922918 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.224212125050133,
            "unit": "iter/sec",
            "range": "stddev: 0.0005674988600091115",
            "extra": "mean: 35.43057271428524 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 168.5806233259388,
            "unit": "iter/sec",
            "range": "stddev: 0.00015149327891056822",
            "extra": "mean: 5.93187983453217 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 209.82079498039025,
            "unit": "iter/sec",
            "range": "stddev: 0.00013172410357737362",
            "extra": "mean: 4.765971838460814 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 113.76576646629809,
            "unit": "iter/sec",
            "range": "stddev: 0.00023614022668175998",
            "extra": "mean: 8.789990443181688 msec\nrounds: 88"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.6650570831521385,
            "unit": "iter/sec",
            "range": "stddev: 0.045502793910759134",
            "extra": "mean: 150.03622437500042 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.1189876976487,
            "unit": "iter/sec",
            "range": "stddev: 0.026337684868873366",
            "extra": "mean: 47.350754416668174 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.72303249803308,
            "unit": "iter/sec",
            "range": "stddev: 0.0014328156675498943",
            "extra": "mean: 29.653323735293547 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 110.92597958248268,
            "unit": "iter/sec",
            "range": "stddev: 0.01241721228943918",
            "extra": "mean: 9.01502068103367 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 210.78646397895352,
            "unit": "iter/sec",
            "range": "stddev: 0.00021429201558778127",
            "extra": "mean: 4.744137650602874 msec\nrounds: 166"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 211.64828952554208,
            "unit": "iter/sec",
            "range": "stddev: 0.00013831676543472107",
            "extra": "mean: 4.724819663044422 msec\nrounds: 92"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 176.743824854261,
            "unit": "iter/sec",
            "range": "stddev: 0.0001388358567889431",
            "extra": "mean: 5.657906299270018 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 101.84521812561019,
            "unit": "iter/sec",
            "range": "stddev: 0.0003770361692644542",
            "extra": "mean: 9.81882132911391 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 179.08096200436106,
            "unit": "iter/sec",
            "range": "stddev: 0.00013504102551038446",
            "extra": "mean: 5.584066495999991 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 228.26424261466178,
            "unit": "iter/sec",
            "range": "stddev: 0.00011268396760219911",
            "extra": "mean: 4.3808876438353215 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 226.26528204367258,
            "unit": "iter/sec",
            "range": "stddev: 0.00013494528433268105",
            "extra": "mean: 4.419590981735259 msec\nrounds: 219"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 190.71932349527773,
            "unit": "iter/sec",
            "range": "stddev: 0.00026123110527700717",
            "extra": "mean: 5.243307189188726 msec\nrounds: 111"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 200.45117550569898,
            "unit": "iter/sec",
            "range": "stddev: 0.0004911637444337182",
            "extra": "mean: 4.988746000003224 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "262e682842145771d1c78776242474c7eaf374fa",
          "message": "Merge pull request #87 from stnkvcmls/claude/zone-duration-calculation-miocvg\n\nfix: HR zone chart shows non-zero time for zones runner never reached",
          "timestamp": "2026-06-25T13:26:03-07:00",
          "tree_id": "540c13a124cfcc2313aa220ddb6b747d5c4d1b06",
          "url": "https://github.com/stnkvcmls/running-coach/commit/262e682842145771d1c78776242474c7eaf374fa"
        },
        "date": 1782419220489,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 388.50654040038086,
            "unit": "iter/sec",
            "range": "stddev: 0.00025204697884088207",
            "extra": "mean: 2.573959241379659 msec\nrounds: 58"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 24.59707498905439,
            "unit": "iter/sec",
            "range": "stddev: 0.02272545160914275",
            "extra": "mean: 40.65524052941239 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 26.817194911506764,
            "unit": "iter/sec",
            "range": "stddev: 0.02373820246734097",
            "extra": "mean: 37.289507843749846 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 83.38988167990209,
            "unit": "iter/sec",
            "range": "stddev: 0.00024305021988568732",
            "extra": "mean: 11.991862559999428 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 78.79011943637835,
            "unit": "iter/sec",
            "range": "stddev: 0.00033288561089699965",
            "extra": "mean: 12.691946746031812 msec\nrounds: 63"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 135.00347641842373,
            "unit": "iter/sec",
            "range": "stddev: 0.010929824362460223",
            "extra": "mean: 7.407216662337233 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 172.11502876265598,
            "unit": "iter/sec",
            "range": "stddev: 0.00029528294218715963",
            "extra": "mean: 5.810067878377924 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 192.53988172896652,
            "unit": "iter/sec",
            "range": "stddev: 0.0002450962657078999",
            "extra": "mean: 5.193729169355544 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 133.92973429089537,
            "unit": "iter/sec",
            "range": "stddev: 0.00030915473661501623",
            "extra": "mean: 7.4666018363629405 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 182.19895153362694,
            "unit": "iter/sec",
            "range": "stddev: 0.0002871444553737184",
            "extra": "mean: 5.488505787671552 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 297.68440037024806,
            "unit": "iter/sec",
            "range": "stddev: 0.000168439202932665",
            "extra": "mean: 3.3592623555558827 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 125.22085229340246,
            "unit": "iter/sec",
            "range": "stddev: 0.009011067896607609",
            "extra": "mean: 7.985890382353573 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 215.84236205926095,
            "unit": "iter/sec",
            "range": "stddev: 0.00023899206170256072",
            "extra": "mean: 4.633010825397858 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 266.47397458229284,
            "unit": "iter/sec",
            "range": "stddev: 0.00018380924658146388",
            "extra": "mean: 3.7527116918923684 msec\nrounds: 185"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 279.49711436305205,
            "unit": "iter/sec",
            "range": "stddev: 0.0002469400687483675",
            "extra": "mean: 3.5778544700860584 msec\nrounds: 234"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 199.64987294185948,
            "unit": "iter/sec",
            "range": "stddev: 0.00851314941940486",
            "extra": "mean: 5.008768526946232 msec\nrounds: 167"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 110.0027746628546,
            "unit": "iter/sec",
            "range": "stddev: 0.00043260052860712633",
            "extra": "mean: 9.090679785713414 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.359487587164995,
            "unit": "iter/sec",
            "range": "stddev: 0.00027752888671700584",
            "extra": "mean: 35.2615680000009 msec\nrounds: 30"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 150.71038518689525,
            "unit": "iter/sec",
            "range": "stddev: 0.0003449647093929994",
            "extra": "mean: 6.635242811966174 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 201.55616405864433,
            "unit": "iter/sec",
            "range": "stddev: 0.00027776446742809694",
            "extra": "mean: 4.9613962672411365 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 108.02755083728711,
            "unit": "iter/sec",
            "range": "stddev: 0.0003763248340563647",
            "extra": "mean: 9.256897821429058 msec\nrounds: 84"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.574474878198535,
            "unit": "iter/sec",
            "range": "stddev: 0.004605879489310037",
            "extra": "mean: 116.6252177777791 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 20.731296446080798,
            "unit": "iter/sec",
            "range": "stddev: 0.02538061850860019",
            "extra": "mean: 48.236250086957185 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 37.25506498415835,
            "unit": "iter/sec",
            "range": "stddev: 0.0010857567915909317",
            "extra": "mean: 26.841987805556673 msec\nrounds: 36"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 100.14284919641852,
            "unit": "iter/sec",
            "range": "stddev: 0.011924051182099096",
            "extra": "mean: 9.98573545714299 msec\nrounds: 105"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 199.7935046863088,
            "unit": "iter/sec",
            "range": "stddev: 0.000444316147991586",
            "extra": "mean: 5.00516771839043 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 176.89554728533972,
            "unit": "iter/sec",
            "range": "stddev: 0.00036860351812929203",
            "extra": "mean: 5.653053541177942 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 162.19895710330323,
            "unit": "iter/sec",
            "range": "stddev: 0.000613649695422189",
            "extra": "mean: 6.165267754237827 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 100.03291293430874,
            "unit": "iter/sec",
            "range": "stddev: 0.00048772230718472346",
            "extra": "mean: 9.996709789473956 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 174.93386028078308,
            "unit": "iter/sec",
            "range": "stddev: 0.0002980500478610023",
            "extra": "mean: 5.716446195121509 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 231.5740031331353,
            "unit": "iter/sec",
            "range": "stddev: 0.00020323889865438117",
            "extra": "mean: 4.318274013793704 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 230.6237637423817,
            "unit": "iter/sec",
            "range": "stddev: 0.0002160208376010382",
            "extra": "mean: 4.336066603773972 msec\nrounds: 212"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 179.42678136833132,
            "unit": "iter/sec",
            "range": "stddev: 0.0006251880991950425",
            "extra": "mean: 5.5733040094342305 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 192.24219792580962,
            "unit": "iter/sec",
            "range": "stddev: 0.0006970333422735512",
            "extra": "mean: 5.201771571431583 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "c2a602dd08b0f9c9e34f245c08d97d25795f9c49",
          "message": "Merge pull request #86 from stnkvcmls/claude/readme-documentation-vg8y3p\n\ndocs: add comprehensive README",
          "timestamp": "2026-06-25T13:34:20-07:00",
          "tree_id": "f5503ba98fab6e20faafdf6b3a214e59d59b00a4",
          "url": "https://github.com/stnkvcmls/running-coach/commit/c2a602dd08b0f9c9e34f245c08d97d25795f9c49"
        },
        "date": 1782419715437,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 543.5687847666628,
            "unit": "iter/sec",
            "range": "stddev: 0.00014196478581796583",
            "extra": "mean: 1.8396935733336288 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 27.4631748691209,
            "unit": "iter/sec",
            "range": "stddev: 0.03292915281896805",
            "extra": "mean: 36.412396045454386 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 34.37494426214869,
            "unit": "iter/sec",
            "range": "stddev: 0.024848807804820967",
            "extra": "mean: 29.09095626086966 msec\nrounds: 46"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 104.30442785918991,
            "unit": "iter/sec",
            "range": "stddev: 0.010888891375754488",
            "extra": "mean: 9.587320696969753 msec\nrounds: 99"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 104.58682255978772,
            "unit": "iter/sec",
            "range": "stddev: 0.00014924979928860154",
            "extra": "mean: 9.561433988764154 msec\nrounds: 89"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 182.44200828121006,
            "unit": "iter/sec",
            "range": "stddev: 0.012364569689447295",
            "extra": "mean: 5.481193774509614 msec\nrounds: 102"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 239.8900173571838,
            "unit": "iter/sec",
            "range": "stddev: 0.00007438762343893559",
            "extra": "mean: 4.168576962963206 msec\nrounds: 189"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 254.73966605309445,
            "unit": "iter/sec",
            "range": "stddev: 0.00010443907907967031",
            "extra": "mean: 3.925576316770289 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 178.14461874036087,
            "unit": "iter/sec",
            "range": "stddev: 0.00033364704666190813",
            "extra": "mean: 5.613416824324414 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 239.21487356933395,
            "unit": "iter/sec",
            "range": "stddev: 0.00013118947611051409",
            "extra": "mean: 4.180342071038323 msec\nrounds: 183"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 383.2380970363973,
            "unit": "iter/sec",
            "range": "stddev: 0.00008791507557691489",
            "extra": "mean: 2.609343924137654 msec\nrounds: 290"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 144.73810891304987,
            "unit": "iter/sec",
            "range": "stddev: 0.01602793324919582",
            "extra": "mean: 6.909030437869968 msec\nrounds: 169"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 294.1255540567648,
            "unit": "iter/sec",
            "range": "stddev: 0.00012384751255753703",
            "extra": "mean: 3.399908597561043 msec\nrounds: 164"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 348.32304847059333,
            "unit": "iter/sec",
            "range": "stddev: 0.00010259031804372449",
            "extra": "mean: 2.8708981630436767 msec\nrounds: 276"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 360.09683889056356,
            "unit": "iter/sec",
            "range": "stddev: 0.00009089548130618271",
            "extra": "mean: 2.777030765060141 msec\nrounds: 332"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 293.1568665623798,
            "unit": "iter/sec",
            "range": "stddev: 0.0006732195275242448",
            "extra": "mean: 3.4111430229358572 msec\nrounds: 218"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 144.25250046450387,
            "unit": "iter/sec",
            "range": "stddev: 0.00021366696654871256",
            "extra": "mean: 6.932288846154659 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 36.23776580186141,
            "unit": "iter/sec",
            "range": "stddev: 0.000794135842264763",
            "extra": "mean: 27.59552024999934 msec\nrounds: 36"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 206.78095025069837,
            "unit": "iter/sec",
            "range": "stddev: 0.00010216066947068085",
            "extra": "mean: 4.836035421965195 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 266.0308666050438,
            "unit": "iter/sec",
            "range": "stddev: 0.00022973547032616542",
            "extra": "mean: 3.7589623067485074 msec\nrounds: 163"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 137.93438653793004,
            "unit": "iter/sec",
            "range": "stddev: 0.00017233396811719952",
            "extra": "mean: 7.249823811881846 msec\nrounds: 101"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.965088499946772,
            "unit": "iter/sec",
            "range": "stddev: 0.04513583833004385",
            "extra": "mean: 100.35033808333378 msec\nrounds: 12"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.746271484867425,
            "unit": "iter/sec",
            "range": "stddev: 0.043544013301647796",
            "extra": "mean: 45.9848945000006 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 53.23548622572854,
            "unit": "iter/sec",
            "range": "stddev: 0.0006029415477452268",
            "extra": "mean: 18.784462599999756 msec\nrounds: 50"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 162.9919881663496,
            "unit": "iter/sec",
            "range": "stddev: 0.00014397519972703934",
            "extra": "mean: 6.135270888158011 msec\nrounds: 152"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 275.82875747522206,
            "unit": "iter/sec",
            "range": "stddev: 0.00010477614076059387",
            "extra": "mean: 3.625437786666718 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 268.61901661295724,
            "unit": "iter/sec",
            "range": "stddev: 0.0001340264775588156",
            "extra": "mean: 3.7227446239998017 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 229.16420062926687,
            "unit": "iter/sec",
            "range": "stddev: 0.00010600768334925118",
            "extra": "mean: 4.363683320754633 msec\nrounds: 159"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 117.58193383405954,
            "unit": "iter/sec",
            "range": "stddev: 0.0006221627544229484",
            "extra": "mean: 8.504707886598252 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 225.46679406410502,
            "unit": "iter/sec",
            "range": "stddev: 0.00012599276620829715",
            "extra": "mean: 4.435242910828274 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 279.22872612523355,
            "unit": "iter/sec",
            "range": "stddev: 0.00018846491911700793",
            "extra": "mean: 3.5812934216213197 msec\nrounds: 185"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 280.34975871013233,
            "unit": "iter/sec",
            "range": "stddev: 0.00009671652794047877",
            "extra": "mean: 3.566972929104427 msec\nrounds: 268"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 235.21952340850038,
            "unit": "iter/sec",
            "range": "stddev: 0.00027099709962126364",
            "extra": "mean: 4.251347785716421 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 253.98203188839415,
            "unit": "iter/sec",
            "range": "stddev: 0.0001705667744674983",
            "extra": "mean: 3.937286400005746 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "64a174e1b9efb9a86ace4722d271c1ea53250ac9",
          "message": "Merge pull request #88 from stnkvcmls/claude/workout-dark-theme-colors-nku5s0\n\nfix: dark theme tooltip text color on workout page zone charts",
          "timestamp": "2026-06-25T17:08:44-07:00",
          "tree_id": "92673b110bfd8886c8084eb6dafd45442cbcffb7",
          "url": "https://github.com/stnkvcmls/running-coach/commit/64a174e1b9efb9a86ace4722d271c1ea53250ac9"
        },
        "date": 1782432577347,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 384.8609918405556,
            "unit": "iter/sec",
            "range": "stddev: 0.0002044669797581416",
            "extra": "mean: 2.5983407547166824 msec\nrounds: 53"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 22.423028837706994,
            "unit": "iter/sec",
            "range": "stddev: 0.033917154958229716",
            "extra": "mean: 44.59700815789796 msec\nrounds: 19"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 28.032467899523155,
            "unit": "iter/sec",
            "range": "stddev: 0.024874126988719426",
            "extra": "mean: 35.67292054286131 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 80.38990145100603,
            "unit": "iter/sec",
            "range": "stddev: 0.01128904396349458",
            "extra": "mean: 12.439373378377063 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 82.19907697929494,
            "unit": "iter/sec",
            "range": "stddev: 0.0001862826997412683",
            "extra": "mean: 12.165586728569824 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 180.05465720469286,
            "unit": "iter/sec",
            "range": "stddev: 0.00007087311130016484",
            "extra": "mean: 5.553869116882451 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 184.60726034681022,
            "unit": "iter/sec",
            "range": "stddev: 0.00007765404761699887",
            "extra": "mean: 5.416905045453586 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 201.36535430265937,
            "unit": "iter/sec",
            "range": "stddev: 0.0001262802768006336",
            "extra": "mean: 4.966097586464472 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 141.57869785138377,
            "unit": "iter/sec",
            "range": "stddev: 0.00032376527277627585",
            "extra": "mean: 7.063209474137893 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 186.58588443851764,
            "unit": "iter/sec",
            "range": "stddev: 0.00027635081995288805",
            "extra": "mean: 5.359462228395484 msec\nrounds: 162"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 248.45275318800446,
            "unit": "iter/sec",
            "range": "stddev: 0.008602255081009553",
            "extra": "mean: 4.024910117390806 msec\nrounds: 230"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 149.53071334710714,
            "unit": "iter/sec",
            "range": "stddev: 0.00023168813537837623",
            "extra": "mean: 6.687589309352721 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 219.38618805779788,
            "unit": "iter/sec",
            "range": "stddev: 0.0001530633195591134",
            "extra": "mean: 4.558172093024139 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 264.7998123670885,
            "unit": "iter/sec",
            "range": "stddev: 0.00017358820961058753",
            "extra": "mean: 3.776437721238689 msec\nrounds: 226"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 279.61385450495,
            "unit": "iter/sec",
            "range": "stddev: 0.0001281136178338056",
            "extra": "mean: 3.5763606984728185 msec\nrounds: 262"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 232.91785566713844,
            "unit": "iter/sec",
            "range": "stddev: 0.00014933949890877217",
            "extra": "mean: 4.293359120689717 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 113.2166919235864,
            "unit": "iter/sec",
            "range": "stddev: 0.00029853260815003755",
            "extra": "mean: 8.832619846152475 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.07159251568018,
            "unit": "iter/sec",
            "range": "stddev: 0.0003542783950230558",
            "extra": "mean: 35.62320162069259 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 158.63923423661137,
            "unit": "iter/sec",
            "range": "stddev: 0.0003141760811779282",
            "extra": "mean: 6.303610861538162 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 165.9359747463732,
            "unit": "iter/sec",
            "range": "stddev: 0.013767210013714703",
            "extra": "mean: 6.026420741665343 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 89.14255868820939,
            "unit": "iter/sec",
            "range": "stddev: 0.001438324276913038",
            "extra": "mean: 11.217986276315703 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.444024397998422,
            "unit": "iter/sec",
            "range": "stddev: 0.004004678780278926",
            "extra": "mean: 134.33593799999954 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.515639550117008,
            "unit": "iter/sec",
            "range": "stddev: 0.03438823541477884",
            "extra": "mean: 51.24095459090421 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.29524159268614,
            "unit": "iter/sec",
            "range": "stddev: 0.0015879562395983155",
            "extra": "mean: 30.034321787881748 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 123.48766692464972,
            "unit": "iter/sec",
            "range": "stddev: 0.0007356186671209872",
            "extra": "mean: 8.097974679610594 msec\nrounds: 103"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 214.5710803143609,
            "unit": "iter/sec",
            "range": "stddev: 0.0002998842309881344",
            "extra": "mean: 4.660460293786719 msec\nrounds: 177"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 213.7356948717612,
            "unit": "iter/sec",
            "range": "stddev: 0.0001830280230637233",
            "extra": "mean: 4.67867569148891 msec\nrounds: 94"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 177.67468576632473,
            "unit": "iter/sec",
            "range": "stddev: 0.00015519613363368826",
            "extra": "mean: 5.628263788321461 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 103.74789729459123,
            "unit": "iter/sec",
            "range": "stddev: 0.0005573632088993582",
            "extra": "mean: 9.638749565791285 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 182.06854700330518,
            "unit": "iter/sec",
            "range": "stddev: 0.00022438438154194224",
            "extra": "mean: 5.492436867647691 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 231.58676464486288,
            "unit": "iter/sec",
            "range": "stddev: 0.00013767728913054202",
            "extra": "mean: 4.318036056738799 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 201.34966786564897,
            "unit": "iter/sec",
            "range": "stddev: 0.009118956114929178",
            "extra": "mean: 4.966484477477521 msec\nrounds: 222"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 182.77634233774748,
            "unit": "iter/sec",
            "range": "stddev: 0.0006220597611327791",
            "extra": "mean: 5.471167587718365 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 207.3951511220995,
            "unit": "iter/sec",
            "range": "stddev: 0.00026630606975985524",
            "extra": "mean: 4.821713500000158 msec\nrounds: 12"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7cf3bd0df2e472931fa81a922bfc77256abcf91b",
          "message": "Merge pull request #89 from stnkvcmls/claude/p0-1-streaming-tokens-xr2jr6\n\nfeat(p0-1): conversational AI coach with SSE streaming tokens",
          "timestamp": "2026-06-26T05:23:57-07:00",
          "tree_id": "5b62e0577878be97b5b2cf21bc8c94a90579ae60",
          "url": "https://github.com/stnkvcmls/running-coach/commit/7cf3bd0df2e472931fa81a922bfc77256abcf91b"
        },
        "date": 1782476693092,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 370.8686799567915,
            "unit": "iter/sec",
            "range": "stddev: 0.0002836822165326645",
            "extra": "mean: 2.696372204081796 msec\nrounds: 49"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 23.415246856723524,
            "unit": "iter/sec",
            "range": "stddev: 0.02814385542772142",
            "extra": "mean: 42.70721577777673 msec\nrounds: 18"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 31.118851406751013,
            "unit": "iter/sec",
            "range": "stddev: 0.002016597546703139",
            "extra": "mean: 32.13486214285715 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 68.490086778184,
            "unit": "iter/sec",
            "range": "stddev: 0.014521844831083847",
            "extra": "mean: 14.600653131578861 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 67.97013325488975,
            "unit": "iter/sec",
            "range": "stddev: 0.0010438761401091671",
            "extra": "mean: 14.712344262294945 msec\nrounds: 61"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 150.20657771982127,
            "unit": "iter/sec",
            "range": "stddev: 0.0008571740432892353",
            "extra": "mean: 6.657498061538219 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 151.35937545814588,
            "unit": "iter/sec",
            "range": "stddev: 0.001402522236435078",
            "extra": "mean: 6.606792588652835 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 131.58660094801508,
            "unit": "iter/sec",
            "range": "stddev: 0.012930036969682656",
            "extra": "mean: 7.599557954955174 msec\nrounds: 111"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 123.63245145602872,
            "unit": "iter/sec",
            "range": "stddev: 0.0007934428830771325",
            "extra": "mean: 8.088491235294006 msec\nrounds: 102"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 184.79845681673544,
            "unit": "iter/sec",
            "range": "stddev: 0.0002023842290463919",
            "extra": "mean: 5.411300598639196 msec\nrounds: 147"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 290.8484763474037,
            "unit": "iter/sec",
            "range": "stddev: 0.0001223066552613655",
            "extra": "mean: 3.438216395555571 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 152.7029715938514,
            "unit": "iter/sec",
            "range": "stddev: 0.00011491040325271446",
            "extra": "mean: 6.548661034964857 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 221.0053986234775,
            "unit": "iter/sec",
            "range": "stddev: 0.00013835920995509306",
            "extra": "mean: 4.524776345865107 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 236.42296521912235,
            "unit": "iter/sec",
            "range": "stddev: 0.00722832908866048",
            "extra": "mean: 4.229707545851888 msec\nrounds: 229"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 281.1662492071535,
            "unit": "iter/sec",
            "range": "stddev: 0.00009942719764797894",
            "extra": "mean: 3.5566146463875 msec\nrounds: 263"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 233.51585866909443,
            "unit": "iter/sec",
            "range": "stddev: 0.00025447915685273615",
            "extra": "mean: 4.282364400000165 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 122.90967166846579,
            "unit": "iter/sec",
            "range": "stddev: 0.000125573619586501",
            "extra": "mean: 8.136056230769055 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 29.413745779334405,
            "unit": "iter/sec",
            "range": "stddev: 0.0005261247767116496",
            "extra": "mean: 33.99771003333356 msec\nrounds: 30"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 151.1058701676302,
            "unit": "iter/sec",
            "range": "stddev: 0.00042955315623639426",
            "extra": "mean: 6.617876584745808 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 193.3119462934723,
            "unit": "iter/sec",
            "range": "stddev: 0.0005901714317023445",
            "extra": "mean: 5.1729860423725285 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 92.32873394093352,
            "unit": "iter/sec",
            "range": "stddev: 0.0005839433997887274",
            "extra": "mean: 10.830864426666361 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.293397803067956,
            "unit": "iter/sec",
            "range": "stddev: 0.008197147922306606",
            "extra": "mean: 137.1103053749998 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 22.671992404882598,
            "unit": "iter/sec",
            "range": "stddev: 0.02400190802352975",
            "extra": "mean: 44.10728365384605 msec\nrounds: 26"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.448840616522965,
            "unit": "iter/sec",
            "range": "stddev: 0.0008425743186977913",
            "extra": "mean: 29.896402433333456 msec\nrounds: 30"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 130.3171733450524,
            "unit": "iter/sec",
            "range": "stddev: 0.00009271684214758405",
            "extra": "mean: 7.6735857165364605 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 216.72498046667147,
            "unit": "iter/sec",
            "range": "stddev: 0.0001950266447545459",
            "extra": "mean: 4.614142762162032 msec\nrounds: 185"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 217.07542603455187,
            "unit": "iter/sec",
            "range": "stddev: 0.00009755062550970274",
            "extra": "mean: 4.606693711340823 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 180.99497600222682,
            "unit": "iter/sec",
            "range": "stddev: 0.00011091024005161167",
            "extra": "mean: 5.525015235714039 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 109.50355368745349,
            "unit": "iter/sec",
            "range": "stddev: 0.0001293792383537504",
            "extra": "mean: 9.132123719511545 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 182.55691077443157,
            "unit": "iter/sec",
            "range": "stddev: 0.0001320006483237908",
            "extra": "mean: 5.477743875911693 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 231.65570102776385,
            "unit": "iter/sec",
            "range": "stddev: 0.00012911601652236442",
            "extra": "mean: 4.316751090361253 msec\nrounds: 166"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 232.22519096327028,
            "unit": "iter/sec",
            "range": "stddev: 0.00010373502838672656",
            "extra": "mean: 4.306165045454367 msec\nrounds: 220"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 193.48924503208704,
            "unit": "iter/sec",
            "range": "stddev: 0.00023870552336439417",
            "extra": "mean: 5.168245913793122 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 210.75986595667115,
            "unit": "iter/sec",
            "range": "stddev: 0.00012961030821312378",
            "extra": "mean: 4.744736363637581 msec\nrounds: 11"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "0f4a09b18202e9b05e9d1dc9a34f70b402f28960",
          "message": "Merge pull request #90 from stnkvcmls/claude/p0-2-streaming-tokens-gvziei\n\nfeat(p0-2): aerobic decoupling and efficiency factor",
          "timestamp": "2026-06-26T06:56:48-07:00",
          "tree_id": "012f55d35a28d3bfa012e9950098d7ff4b9ae6b2",
          "url": "https://github.com/stnkvcmls/running-coach/commit/0f4a09b18202e9b05e9d1dc9a34f70b402f28960"
        },
        "date": 1782482266187,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 375.64857029995454,
            "unit": "iter/sec",
            "range": "stddev: 0.00017837280445091833",
            "extra": "mean: 2.662062574074226 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 21.25605154473495,
            "unit": "iter/sec",
            "range": "stddev: 0.03545192147952887",
            "extra": "mean: 47.045425999999345 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 27.841261220067636,
            "unit": "iter/sec",
            "range": "stddev: 0.022046121833401638",
            "extra": "mean: 35.91791306060562 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 68.44732669252,
            "unit": "iter/sec",
            "range": "stddev: 0.0184447110313908",
            "extra": "mean: 14.609774381579774 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 75.98298276569975,
            "unit": "iter/sec",
            "range": "stddev: 0.00042108609661184313",
            "extra": "mean: 13.160841593749861 msec\nrounds: 64"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 127.22501618193702,
            "unit": "iter/sec",
            "range": "stddev: 0.01355900875705089",
            "extra": "mean: 7.860089391303034 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 179.38132595138893,
            "unit": "iter/sec",
            "range": "stddev: 0.00013879944915567012",
            "extra": "mean: 5.574716290540705 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 186.82018514785193,
            "unit": "iter/sec",
            "range": "stddev: 0.0006160465146700915",
            "extra": "mean: 5.352740653846301 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 111.04765440427629,
            "unit": "iter/sec",
            "range": "stddev: 0.0010980317006144959",
            "extra": "mean: 9.00514293043448 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 161.8869772437418,
            "unit": "iter/sec",
            "range": "stddev: 0.0003989685875963437",
            "extra": "mean: 6.177149126049655 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 282.4433026291463,
            "unit": "iter/sec",
            "range": "stddev: 0.00012420615536370158",
            "extra": "mean: 3.5405335891891196 msec\nrounds: 185"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 129.50440171078392,
            "unit": "iter/sec",
            "range": "stddev: 0.010241547038816428",
            "extra": "mean: 7.7217452595414695 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 215.56212576845573,
            "unit": "iter/sec",
            "range": "stddev: 0.00018588582249827928",
            "extra": "mean: 4.639033858267577 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 221.31433117832376,
            "unit": "iter/sec",
            "range": "stddev: 0.00039830418651904835",
            "extra": "mean: 4.5184602130182485 msec\nrounds: 169"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 269.8233805424443,
            "unit": "iter/sec",
            "range": "stddev: 0.0002455426516217935",
            "extra": "mean: 3.7061280530606058 msec\nrounds: 245"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 232.2985169127462,
            "unit": "iter/sec",
            "range": "stddev: 0.00017200997394882845",
            "extra": "mean: 4.304805787355115 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 109.38055553305121,
            "unit": "iter/sec",
            "range": "stddev: 0.0005326940283613634",
            "extra": "mean: 9.14239276923249 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.279712234187418,
            "unit": "iter/sec",
            "range": "stddev: 0.0006271785734913798",
            "extra": "mean: 36.65727817857193 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 161.4995133897407,
            "unit": "iter/sec",
            "range": "stddev: 0.00023961677346776364",
            "extra": "mean: 6.191969121211763 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 206.4466331395004,
            "unit": "iter/sec",
            "range": "stddev: 0.00015116699567809905",
            "extra": "mean: 4.843866837606786 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 92.77500473071224,
            "unit": "iter/sec",
            "range": "stddev: 0.0005531386935062202",
            "extra": "mean: 10.778765281689713 msec\nrounds: 71"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.131710106761489,
            "unit": "iter/sec",
            "range": "stddev: 0.006988438242243147",
            "extra": "mean: 140.21882340000218 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.88870176993076,
            "unit": "iter/sec",
            "range": "stddev: 0.030733326502932555",
            "extra": "mean: 50.279802652170865 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 31.879127546302144,
            "unit": "iter/sec",
            "range": "stddev: 0.001436847793147675",
            "extra": "mean: 31.36848706250106 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 126.92874011041584,
            "unit": "iter/sec",
            "range": "stddev: 0.0001721306743709737",
            "extra": "mean: 7.878436350428562 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 178.05351576468294,
            "unit": "iter/sec",
            "range": "stddev: 0.010663758226505995",
            "extra": "mean: 5.616288988764527 msec\nrounds: 178"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 210.9289816287223,
            "unit": "iter/sec",
            "range": "stddev: 0.00015812718943766538",
            "extra": "mean: 4.7409321956534285 msec\nrounds: 92"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 173.2794302444072,
            "unit": "iter/sec",
            "range": "stddev: 0.00027356079242970107",
            "extra": "mean: 5.771025439023662 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 98.40677450087037,
            "unit": "iter/sec",
            "range": "stddev: 0.0007762936237303517",
            "extra": "mean: 10.16190201408497 msec\nrounds: 71"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 171.09781292022083,
            "unit": "iter/sec",
            "range": "stddev: 0.00108676792358737",
            "extra": "mean: 5.844610067963161 msec\nrounds: 103"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 227.9559826238195,
            "unit": "iter/sec",
            "range": "stddev: 0.00019479636218767694",
            "extra": "mean: 4.386811824325896 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 227.70978970002727,
            "unit": "iter/sec",
            "range": "stddev: 0.00012841524907712874",
            "extra": "mean: 4.391554712326363 msec\nrounds: 219"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 185.7980119973513,
            "unit": "iter/sec",
            "range": "stddev: 0.00036930470168042",
            "extra": "mean: 5.382188911764329 msec\nrounds: 102"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 187.84085836952775,
            "unit": "iter/sec",
            "range": "stddev: 0.0004130632735610304",
            "extra": "mean: 5.323655400002281 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "2b00847d36d72c646471957210d8256b6cdf59c9",
          "message": "Merge pull request #92 from stnkvcmls/claude/cadence-stride-calculation-rghjmk\n\nfix: correct cadence doubling and stride unit conversion",
          "timestamp": "2026-06-26T12:36:46-07:00",
          "tree_id": "4db33d24cd6ac88d0167457b9fccbb9b6101ef8c",
          "url": "https://github.com/stnkvcmls/running-coach/commit/2b00847d36d72c646471957210d8256b6cdf59c9"
        },
        "date": 1782502662200,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 426.08350092212186,
            "unit": "iter/sec",
            "range": "stddev: 0.00020100927543751138",
            "extra": "mean: 2.3469578095275194 msec\nrounds: 63"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 27.364954258591386,
            "unit": "iter/sec",
            "range": "stddev: 0.019791093854868165",
            "extra": "mean: 36.54309049999761 msec\nrounds: 18"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 29.255287461050397,
            "unit": "iter/sec",
            "range": "stddev: 0.020012743018542566",
            "extra": "mean: 34.181855205879266 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 86.24945217137252,
            "unit": "iter/sec",
            "range": "stddev: 0.00932910334528539",
            "extra": "mean: 11.59427654117802 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 86.97584334169268,
            "unit": "iter/sec",
            "range": "stddev: 0.00033374680414019155",
            "extra": "mean: 11.497445285714646 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 176.29143360834527,
            "unit": "iter/sec",
            "range": "stddev: 0.00012120300265746335",
            "extra": "mean: 5.672425367086367 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 192.56071477246226,
            "unit": "iter/sec",
            "range": "stddev: 0.00017787685805869668",
            "extra": "mean: 5.193167262500253 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 221.58437544032427,
            "unit": "iter/sec",
            "range": "stddev: 0.00019280439949625753",
            "extra": "mean: 4.5129535781249785 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 156.0339770631185,
            "unit": "iter/sec",
            "range": "stddev: 0.00017580308534184488",
            "extra": "mean: 6.408860549619153 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 210.15147735313394,
            "unit": "iter/sec",
            "range": "stddev: 0.00020007701777030788",
            "extra": "mean: 4.7584723771397615 msec\nrounds: 175"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 275.2980621824102,
            "unit": "iter/sec",
            "range": "stddev: 0.0064645474500811565",
            "extra": "mean: 3.632426585470871 msec\nrounds: 234"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 156.821852575189,
            "unit": "iter/sec",
            "range": "stddev: 0.00023119734454764108",
            "extra": "mean: 6.3766623310392605 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 241.46555618424662,
            "unit": "iter/sec",
            "range": "stddev: 0.00013362943415532746",
            "extra": "mean: 4.141377411347916 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 285.91674255614646,
            "unit": "iter/sec",
            "range": "stddev: 0.00013113654832217002",
            "extra": "mean: 3.497521659836435 msec\nrounds: 244"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 295.13984116718075,
            "unit": "iter/sec",
            "range": "stddev: 0.0001419015802169926",
            "extra": "mean: 3.3882243618663264 msec\nrounds: 257"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 250.7140165158399,
            "unit": "iter/sec",
            "range": "stddev: 0.00013429231639015945",
            "extra": "mean: 3.988608271276372 msec\nrounds: 188"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 122.93844737120241,
            "unit": "iter/sec",
            "range": "stddev: 0.0007521492332154676",
            "extra": "mean: 8.134151857153224 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.814472137414096,
            "unit": "iter/sec",
            "range": "stddev: 0.000600905986539884",
            "extra": "mean: 34.70478290322563 msec\nrounds: 31"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 161.37084741250015,
            "unit": "iter/sec",
            "range": "stddev: 0.008928034243031764",
            "extra": "mean: 6.1969061700703305 msec\nrounds: 147"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 218.52045641676386,
            "unit": "iter/sec",
            "range": "stddev: 0.00018069913001670157",
            "extra": "mean: 4.576230602835611 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 111.33752666873315,
            "unit": "iter/sec",
            "range": "stddev: 0.000271295982221644",
            "extra": "mean: 8.981697635293612 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.96152348384563,
            "unit": "iter/sec",
            "range": "stddev: 0.005356301675234488",
            "extra": "mean: 111.58816933333229 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.564235614488062,
            "unit": "iter/sec",
            "range": "stddev: 0.02297951394647399",
            "extra": "mean: 46.373078919993986 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 39.95298656370913,
            "unit": "iter/sec",
            "range": "stddev: 0.0008058136300782753",
            "extra": "mean: 25.02941797368258 msec\nrounds: 38"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 133.1205597236246,
            "unit": "iter/sec",
            "range": "stddev: 0.0002721042915749491",
            "extra": "mean: 7.511987645455582 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 225.8311500880341,
            "unit": "iter/sec",
            "range": "stddev: 0.00013877442206466234",
            "extra": "mean: 4.428087089005115 msec\nrounds: 191"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 222.94552355849376,
            "unit": "iter/sec",
            "range": "stddev: 0.00013266207202830454",
            "extra": "mean: 4.485400666668384 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 186.19079821491567,
            "unit": "iter/sec",
            "range": "stddev: 0.00034084773590763585",
            "extra": "mean: 5.370834700680125 msec\nrounds: 147"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 115.75389532709652,
            "unit": "iter/sec",
            "range": "stddev: 0.0003193239594304951",
            "extra": "mean: 8.639018126985768 msec\nrounds: 63"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 157.9228849871054,
            "unit": "iter/sec",
            "range": "stddev: 0.010562746009999896",
            "extra": "mean: 6.332204481203919 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 236.97555973428985,
            "unit": "iter/sec",
            "range": "stddev: 0.0001775602818180309",
            "extra": "mean: 4.219844447761852 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 239.88917431356722,
            "unit": "iter/sec",
            "range": "stddev: 0.00010689232003984148",
            "extra": "mean: 4.1685916126121905 msec\nrounds: 222"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 199.5740683524318,
            "unit": "iter/sec",
            "range": "stddev: 0.00017340585529089796",
            "extra": "mean: 5.010671016808057 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 211.21462844354824,
            "unit": "iter/sec",
            "range": "stddev: 0.00038039756741516253",
            "extra": "mean: 4.734520555555516 msec\nrounds: 9"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "1467ca85e6be37edb142e9416dbdaf0b9ccd6bd2",
          "message": "Merge pull request #91 from stnkvcmls/claude/workout-adherence-intervals-sm9630\n\nFix interval alignment grouping all same-intensity laps into one segment",
          "timestamp": "2026-06-26T14:09:24-07:00",
          "tree_id": "e7a135e5dcc84038d8f3dde5ab3347135c8d09a9",
          "url": "https://github.com/stnkvcmls/running-coach/commit/1467ca85e6be37edb142e9416dbdaf0b9ccd6bd2"
        },
        "date": 1782508222032,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 515.7099554795802,
            "unit": "iter/sec",
            "range": "stddev: 0.0003557564559161597",
            "extra": "mean: 1.9390744533330917 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 29.535311958226046,
            "unit": "iter/sec",
            "range": "stddev: 0.02775881206774642",
            "extra": "mean: 33.857776800000394 msec\nrounds: 20"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 29.295040068770216,
            "unit": "iter/sec",
            "range": "stddev: 0.03367786182986961",
            "extra": "mean: 34.13547131707266 msec\nrounds: 41"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 87.6072727852344,
            "unit": "iter/sec",
            "range": "stddev: 0.017908118057203236",
            "extra": "mean: 11.414577445544488 msec\nrounds: 101"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 90.47763882931203,
            "unit": "iter/sec",
            "range": "stddev: 0.0005368803543274775",
            "extra": "mean: 11.052454649999444 msec\nrounds: 80"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 198.4883515103654,
            "unit": "iter/sec",
            "range": "stddev: 0.00036108604415333186",
            "extra": "mean: 5.038079022726824 msec\nrounds: 88"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 229.1495058801836,
            "unit": "iter/sec",
            "range": "stddev: 0.00011593972089388311",
            "extra": "mean: 4.363963152173998 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 230.73271792562159,
            "unit": "iter/sec",
            "range": "stddev: 0.00020293597757740196",
            "extra": "mean: 4.334019071895809 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 137.28337501651333,
            "unit": "iter/sec",
            "range": "stddev: 0.01302305259360408",
            "extra": "mean: 7.284203202898483 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 182.65022094468796,
            "unit": "iter/sec",
            "range": "stddev: 0.0005580293444577989",
            "extra": "mean: 5.474945471337976 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 332.9480995549831,
            "unit": "iter/sec",
            "range": "stddev: 0.00021130674096271433",
            "extra": "mean: 3.0034711155780593 msec\nrounds: 199"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 166.77482031027856,
            "unit": "iter/sec",
            "range": "stddev: 0.0003472953532536285",
            "extra": "mean: 5.996108993788967 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 277.306192956052,
            "unit": "iter/sec",
            "range": "stddev: 0.00024424957034412613",
            "extra": "mean: 3.606122132867339 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 328.8465623508754,
            "unit": "iter/sec",
            "range": "stddev: 0.0001603137498210831",
            "extra": "mean: 3.040931894957782 msec\nrounds: 238"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 354.8375319530839,
            "unit": "iter/sec",
            "range": "stddev: 0.00013673179284996717",
            "extra": "mean: 2.8181911718747346 msec\nrounds: 256"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 279.6463368705697,
            "unit": "iter/sec",
            "range": "stddev: 0.0004894888378406119",
            "extra": "mean: 3.5759452857157776 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 132.22015908170727,
            "unit": "iter/sec",
            "range": "stddev: 0.0006876319359219826",
            "extra": "mean: 7.5631432222225365 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 33.528751501409694,
            "unit": "iter/sec",
            "range": "stddev: 0.000936761330964349",
            "extra": "mean: 29.82514872222295 msec\nrounds: 36"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 203.52671475337064,
            "unit": "iter/sec",
            "range": "stddev: 0.0002139267651646661",
            "extra": "mean: 4.913359905660438 msec\nrounds: 159"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 271.5360500067157,
            "unit": "iter/sec",
            "range": "stddev: 0.00013063241254364166",
            "extra": "mean: 3.6827522532469184 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 111.22078824078226,
            "unit": "iter/sec",
            "range": "stddev: 0.0005184904594086339",
            "extra": "mean: 8.991124913043203 msec\nrounds: 92"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.776478300929064,
            "unit": "iter/sec",
            "range": "stddev: 0.06506537719861545",
            "extra": "mean: 113.94091863636712 msec\nrounds: 11"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 24.36026774575968,
            "unit": "iter/sec",
            "range": "stddev: 0.029963234513440556",
            "extra": "mean: 41.05045192592627 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 53.36157871511489,
            "unit": "iter/sec",
            "range": "stddev: 0.0008793591341863911",
            "extra": "mean: 18.740075239129794 msec\nrounds: 46"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 166.63187378713508,
            "unit": "iter/sec",
            "range": "stddev: 0.00018235820897007825",
            "extra": "mean: 6.001252805195339 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 280.87128713951523,
            "unit": "iter/sec",
            "range": "stddev: 0.00015942198853738805",
            "extra": "mean: 3.5603496896543825 msec\nrounds: 232"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 264.1262250049941,
            "unit": "iter/sec",
            "range": "stddev: 0.0003812223884572389",
            "extra": "mean: 3.786068573770332 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 217.64482306164285,
            "unit": "iter/sec",
            "range": "stddev: 0.0005146235293051912",
            "extra": "mean: 4.594641792682444 msec\nrounds: 164"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 107.9171839650676,
            "unit": "iter/sec",
            "range": "stddev: 0.0006991297082900137",
            "extra": "mean: 9.266364848101452 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 229.84421623078651,
            "unit": "iter/sec",
            "range": "stddev: 0.00016960052749645472",
            "extra": "mean: 4.350772955695784 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 214.60601793294532,
            "unit": "iter/sec",
            "range": "stddev: 0.013960615253113599",
            "extra": "mean: 4.659701576087465 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 281.69562144029027,
            "unit": "iter/sec",
            "range": "stddev: 0.00014612361885933518",
            "extra": "mean: 3.5499309321425345 msec\nrounds: 280"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 219.89507483031835,
            "unit": "iter/sec",
            "range": "stddev: 0.0002961841130411739",
            "extra": "mean: 4.547623455284973 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 251.132797265163,
            "unit": "iter/sec",
            "range": "stddev: 0.0003029946702692779",
            "extra": "mean: 3.981957000001606 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "02432c94de868a5ade684218b67199a476edf81b",
          "message": "Merge pull request #93 from stnkvcmls/claude/fix-stride-alembic-migration\n\nfix: migrate existing avg_stride values from cm to m\n\nOne-time data migration divides avg_stride > 5 by 100 to correct\nactivities already stored with Garmin's raw centimetre value.\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01D1GHCuj7NkXQRDdduL8nwP",
          "timestamp": "2026-06-26T14:19:18-07:00",
          "tree_id": "fb0be396d0680c3e45f4cd38bc03e72889eda6c8",
          "url": "https://github.com/stnkvcmls/running-coach/commit/02432c94de868a5ade684218b67199a476edf81b"
        },
        "date": 1782508817775,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 421.88221021016415,
            "unit": "iter/sec",
            "range": "stddev: 0.0001794558588446044",
            "extra": "mean: 2.370329859374354 msec\nrounds: 64"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 23.410517248685075,
            "unit": "iter/sec",
            "range": "stddev: 0.03468720952170951",
            "extra": "mean: 42.715843882354555 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 27.254336010351516,
            "unit": "iter/sec",
            "range": "stddev: 0.028666518805270234",
            "extra": "mean: 36.69140938235253 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 70.70802664923566,
            "unit": "iter/sec",
            "range": "stddev: 0.019528016543757375",
            "extra": "mean: 14.142665937500176 msec\nrounds: 80"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 80.83630656005555,
            "unit": "iter/sec",
            "range": "stddev: 0.0001974746280849087",
            "extra": "mean: 12.370678999999488 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 169.9780338040717,
            "unit": "iter/sec",
            "range": "stddev: 0.0002624124239757352",
            "extra": "mean: 5.883113115384475 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 188.26412172614405,
            "unit": "iter/sec",
            "range": "stddev: 0.00007959885954578282",
            "extra": "mean: 5.311686532894657 msec\nrounds: 152"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 196.88279161678128,
            "unit": "iter/sec",
            "range": "stddev: 0.00013978978890865466",
            "extra": "mean: 5.079164064000224 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 112.36174574662319,
            "unit": "iter/sec",
            "range": "stddev: 0.014454391640345232",
            "extra": "mean: 8.899826122807042 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 181.71452406588804,
            "unit": "iter/sec",
            "range": "stddev: 0.00025547795273458116",
            "extra": "mean: 5.503137435714324 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 305.1264184250558,
            "unit": "iter/sec",
            "range": "stddev: 0.00011735615555705501",
            "extra": "mean: 3.2773301150441574 msec\nrounds: 226"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 151.19195290173616,
            "unit": "iter/sec",
            "range": "stddev: 0.00046550836876107224",
            "extra": "mean: 6.614108626865397 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 237.0281840951519,
            "unit": "iter/sec",
            "range": "stddev: 0.00013794610921825178",
            "extra": "mean: 4.218907569230514 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 280.5839466573802,
            "unit": "iter/sec",
            "range": "stddev: 0.00025120360913318565",
            "extra": "mean: 3.56399577350409 msec\nrounds: 234"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 287.5893109005597,
            "unit": "iter/sec",
            "range": "stddev: 0.000263350253299911",
            "extra": "mean: 3.4771806951676725 msec\nrounds: 269"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 196.48511902381577,
            "unit": "iter/sec",
            "range": "stddev: 0.01309430960771804",
            "extra": "mean: 5.089443948570939 msec\nrounds: 175"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 101.73967407853142,
            "unit": "iter/sec",
            "range": "stddev: 0.000532914858451094",
            "extra": "mean: 9.829007307691139 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 25.896501986448087,
            "unit": "iter/sec",
            "range": "stddev: 0.002542453213327054",
            "extra": "mean: 38.615253925928315 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 157.48741826960065,
            "unit": "iter/sec",
            "range": "stddev: 0.0006652923152829472",
            "extra": "mean: 6.349713589742851 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 190.94005709252943,
            "unit": "iter/sec",
            "range": "stddev: 0.0014024372364698418",
            "extra": "mean: 5.237245736840859 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 85.57645531859588,
            "unit": "iter/sec",
            "range": "stddev: 0.0010881782089230798",
            "extra": "mean: 11.685457130434552 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.716110733240821,
            "unit": "iter/sec",
            "range": "stddev: 0.0053609362378507185",
            "extra": "mean: 114.7300706249954 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 17.247395762739647,
            "unit": "iter/sec",
            "range": "stddev: 0.043302324993738664",
            "extra": "mean: 57.979767714285686 msec\nrounds: 21"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 37.852585318750805,
            "unit": "iter/sec",
            "range": "stddev: 0.002338370754189187",
            "extra": "mean: 26.41827477777683 msec\nrounds: 36"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 121.80422247267764,
            "unit": "iter/sec",
            "range": "stddev: 0.0006732745288802337",
            "extra": "mean: 8.209896009346588 msec\nrounds: 107"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 222.4684456227978,
            "unit": "iter/sec",
            "range": "stddev: 0.0002119402706470481",
            "extra": "mean: 4.495019494564777 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 218.4722823634187,
            "unit": "iter/sec",
            "range": "stddev: 0.00015094775878087246",
            "extra": "mean: 4.577239680851347 msec\nrounds: 94"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 181.4276714332032,
            "unit": "iter/sec",
            "range": "stddev: 0.00032401966366978356",
            "extra": "mean: 5.511838365671651 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 77.36799358891416,
            "unit": "iter/sec",
            "range": "stddev: 0.022579302926168738",
            "extra": "mean: 12.9252414805195 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 180.92009807750216,
            "unit": "iter/sec",
            "range": "stddev: 0.00043738396703202516",
            "extra": "mean: 5.527301889763636 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 234.0729580552661,
            "unit": "iter/sec",
            "range": "stddev: 0.0001743266959091575",
            "extra": "mean: 4.272172267605102 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 232.23775225316353,
            "unit": "iter/sec",
            "range": "stddev: 0.00013083034587639707",
            "extra": "mean: 4.305932133333322 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 192.01604123952185,
            "unit": "iter/sec",
            "range": "stddev: 0.00032464388380705727",
            "extra": "mean: 5.2078982232145625 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 204.0270569023926,
            "unit": "iter/sec",
            "range": "stddev: 0.0005037690796418795",
            "extra": "mean: 4.901310714286312 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "3e0e75bb6e38781b55467ddaafb995b5c576e062",
          "message": "Merge pull request #94 from stnkvcmls/claude/gap-data-plotting-xkg2vc\n\nAdd GAP pace chart to activity detail view",
          "timestamp": "2026-06-26T16:43:44-07:00",
          "tree_id": "2f3c91e44111821449b2d206743dfa24931e41a8",
          "url": "https://github.com/stnkvcmls/running-coach/commit/3e0e75bb6e38781b55467ddaafb995b5c576e062"
        },
        "date": 1782517477549,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 409.9920989145815,
            "unit": "iter/sec",
            "range": "stddev: 0.00020933889281081716",
            "extra": "mean: 2.439071393442491 msec\nrounds: 61"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 24.044632040832195,
            "unit": "iter/sec",
            "range": "stddev: 0.029766591942006",
            "extra": "mean: 41.58932431578976 msec\nrounds: 19"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 26.254159571804475,
            "unit": "iter/sec",
            "range": "stddev: 0.028929263024748617",
            "extra": "mean: 38.08920248484911 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 81.23467902670865,
            "unit": "iter/sec",
            "range": "stddev: 0.012916493927513583",
            "extra": "mean: 12.310013555555704 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 80.11947591053601,
            "unit": "iter/sec",
            "range": "stddev: 0.0005243959062389243",
            "extra": "mean: 12.481359727273206 msec\nrounds: 66"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 164.88774388490413,
            "unit": "iter/sec",
            "range": "stddev: 0.0005747552315871861",
            "extra": "mean: 6.0647321410257495 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 188.25778777254578,
            "unit": "iter/sec",
            "range": "stddev: 0.00005733010512732183",
            "extra": "mean: 5.311865245161631 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 200.9266795415947,
            "unit": "iter/sec",
            "range": "stddev: 0.00013560739810158874",
            "extra": "mean: 4.976939858267979 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 144.03821558559687,
            "unit": "iter/sec",
            "range": "stddev: 0.00008056416036264102",
            "extra": "mean: 6.942601974999718 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 190.63395081447342,
            "unit": "iter/sec",
            "range": "stddev: 0.00010503007728771989",
            "extra": "mean: 5.245655329114007 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 306.25242233691284,
            "unit": "iter/sec",
            "range": "stddev: 0.00011177535220266549",
            "extra": "mean: 3.2652802951543194 msec\nrounds: 227"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 133.87541644207306,
            "unit": "iter/sec",
            "range": "stddev: 0.01156900932614286",
            "extra": "mean: 7.469631292857214 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 179.85997168683633,
            "unit": "iter/sec",
            "range": "stddev: 0.013422030933972132",
            "extra": "mean: 5.559880781818162 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 277.55991252143787,
            "unit": "iter/sec",
            "range": "stddev: 0.00020448006273551393",
            "extra": "mean: 3.6028257500000587 msec\nrounds: 220"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 291.06532095402207,
            "unit": "iter/sec",
            "range": "stddev: 0.00012089371347320458",
            "extra": "mean: 3.4356549132074874 msec\nrounds: 265"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 248.6226401090583,
            "unit": "iter/sec",
            "range": "stddev: 0.00010107331740261878",
            "extra": "mean: 4.0221598465906006 msec\nrounds: 176"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 116.28995712862688,
            "unit": "iter/sec",
            "range": "stddev: 0.00017326880275088554",
            "extra": "mean: 8.599194846154363 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.701115849998867,
            "unit": "iter/sec",
            "range": "stddev: 0.000283856643373117",
            "extra": "mean: 34.841850931034074 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 167.42520269203771,
            "unit": "iter/sec",
            "range": "stddev: 0.00010631301010275421",
            "extra": "mean: 5.972816421428512 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 217.3754128317985,
            "unit": "iter/sec",
            "range": "stddev: 0.00011860079085659462",
            "extra": "mean: 4.600336289062201 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 96.12657206328268,
            "unit": "iter/sec",
            "range": "stddev: 0.00021977027079773137",
            "extra": "mean: 10.40295080263211 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.782748841415307,
            "unit": "iter/sec",
            "range": "stddev: 0.05889350038250334",
            "extra": "mean: 128.4893063333325 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.91834624250888,
            "unit": "iter/sec",
            "range": "stddev: 0.033712978503957367",
            "extra": "mean: 50.20497122727201 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 41.457341010375565,
            "unit": "iter/sec",
            "range": "stddev: 0.0010378060097256646",
            "extra": "mean: 24.121180365854368 msec\nrounds: 41"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 130.46254735306655,
            "unit": "iter/sec",
            "range": "stddev: 0.00010010074057058856",
            "extra": "mean: 7.6650350639998805 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 225.32424746880443,
            "unit": "iter/sec",
            "range": "stddev: 0.00014392906082290595",
            "extra": "mean: 4.438048772973035 msec\nrounds: 185"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 221.59752142912723,
            "unit": "iter/sec",
            "range": "stddev: 0.00012581436032252475",
            "extra": "mean: 4.512685852940943 msec\nrounds: 102"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 186.16879333371747,
            "unit": "iter/sec",
            "range": "stddev: 0.00011644683431042269",
            "extra": "mean: 5.371469525547425 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 102.94856314214142,
            "unit": "iter/sec",
            "range": "stddev: 0.00017484591876382598",
            "extra": "mean: 9.713588703703387 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 151.22270859731316,
            "unit": "iter/sec",
            "range": "stddev: 0.014760401505581219",
            "extra": "mean: 6.612763448529894 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 237.2048223374911,
            "unit": "iter/sec",
            "range": "stddev: 0.0001105190346004286",
            "extra": "mean: 4.215765894410092 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 234.55339384086437,
            "unit": "iter/sec",
            "range": "stddev: 0.00011750564044731464",
            "extra": "mean: 4.263421575892704 msec\nrounds: 224"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 188.4716901771013,
            "unit": "iter/sec",
            "range": "stddev: 0.0008381676050932889",
            "extra": "mean: 5.305836643478549 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 212.36362842056965,
            "unit": "iter/sec",
            "range": "stddev: 0.0002205047102018283",
            "extra": "mean: 4.708904285716845 msec\nrounds: 7"
          }
        ]
      }
    ]
  }
}