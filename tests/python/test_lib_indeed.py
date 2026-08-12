from _lib_indeed import to_job_results, job_id


def test_job_id_is_stable_and_source_sensitive():
    assert job_id("indeed", "https://a") == job_id("indeed", "https://a")
    assert job_id("indeed", "https://a") != job_id("jooble", "https://a")


def test_to_job_results_maps_jobspy_rows():
    rows = [
        {
            "title": "AI Developer",
            "company": "Acme",
            "location": "Napoli, Campania",
            "job_url": "https://indeed.com/viewjob?jk=1",
            "description": "Great role in AI",
            "date_posted": "2026-08-11",
            "min_amount": 30000,
            "max_amount": 40000,
            "currency": "EUR",
        }
    ]
    out = to_job_results(rows)
    assert len(out) == 1
    r = out[0]
    assert r["title"] == "AI Developer"
    assert r["company"] == "Acme"
    assert r["source"] == "indeed"
    assert r["url"] == "https://indeed.com/viewjob?jk=1"
    assert r["postedAt"] == "2026-08-11"
    assert len(r["id"]) == 16
    assert r["salary"] == "30000 - 40000 EUR"


def test_to_job_results_skips_rows_without_url_and_handles_nan():
    rows = [
        {"title": "No URL", "job_url": None},
        {"title": "NaN salary", "job_url": "https://x", "min_amount": "nan", "max_amount": "nan"},
    ]
    out = to_job_results(rows)
    assert len(out) == 1
    assert out[0]["salary"] is None
