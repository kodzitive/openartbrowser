import csv
import json

import requests

ADD_FOR_TYPES = ["artwork", "artist", "movement"]
GOOGLE_DEV_KEY = open("google_dev_key.txt").read()


def check_yt_id_valid(id) -> bool:
    """Connects to the YT API and checks if the is valid."""
    api_request_url = "https://www.googleapis.com/youtube/v3/videos?part=player&id={0}&key={1}".format(
        id, GOOGLE_DEV_KEY
    )
    try:
        res = requests.get(api_request_url)
        video = res.json()
        video_exists = (video["pageInfo"]["totalResults"] == 1)
        return video_exists or res.status_code == 403
        # 403 means api usage limit is reached

    except requests.HTTPError or KeyError:
        # Unexpected request errors
        # Key error if API response is broken
        return True

def add_youtube_videos(
        videofile_location="youtube_videos.csv",
        ontology_location="../crawler_output/art_ontology.json",
        ontology_output_location="../crawler_output/art_ontology.json",
        check_links=True
) -> None:
    """Load the video csv file and add the links to the ontology file"""
    videos = {}

    with open(videofile_location, encoding="utf-8") as csv_file:
        csv_reader = csv.DictReader(csv_file, delimiter=';')
        for row in csv_reader:
            qid = row["q_id"]
            yt_id = row["yt_id"]
            if check_links and not check_yt_id_valid(yt_id):
                print("Found broken id: {} ({})".format(yt_id, row["videoname"]))
                continue
            if qid not in videos:
                videos[qid] = []
            video_url = "https://www.youtube.com/embed/{}".format(yt_id)
            videos[qid].append(video_url)

    print("done")

    with open(ontology_location, encoding="utf-8") as json_file:
        ontology = json.load(json_file)

    entries_added_count = 0
    for entry in ontology:
        if entry["id"] in videos and entry['type'] in ADD_FOR_TYPES:
            entries_added_count += 1
            entry["videos"] = videos[entry["id"]]

    print("Added videos for {} entries. Saving the file..".format(entries_added_count))

    ontology_out = json.dumps(ontology)
    open(ontology_output_location, 'w').write(ontology_out)


if __name__ == "__main__":
    add_youtube_videos()