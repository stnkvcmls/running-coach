from app.garmin_sync import _map_profile_suggestions


def test_maps_and_converts_garmin_fields():
    user_data = {
        "birthDate": "1990-06-15",
        "weight": 68500.0,           # grams
        "lactateThresholdSpeed": 3.5,  # m/s -> ~4.76 min/km
        "lactateThresholdHeartRate": 168,
        "maxHeartRate": 190,
    }
    out = _map_profile_suggestions("Sam Runner", user_data, resting_hr=48)

    assert out["name"] == "Sam Runner"
    assert out["date_of_birth"] == "1990-06-15"
    assert out["weight_kg"] == 68.5
    assert out["threshold_pace_min_km"] == round(1000 / (3.5 * 60), 2)
    assert out["threshold_hr"] == 168
    assert out["max_hr"] == 190
    assert out["resting_hr"] == 48


def test_omits_missing_and_zero_fields():
    out = _map_profile_suggestions(None, {"lactateThresholdSpeed": 0}, resting_hr=None)
    # Nothing usable -> empty dict, so the form is never clobbered with blanks.
    assert out == {}


def test_partial_payload_only_returns_present_fields():
    out = _map_profile_suggestions(None, {"weight": 70000.0}, resting_hr=52)
    assert out == {"weight_kg": 70.0, "resting_hr": 52}
