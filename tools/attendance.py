import os, sys, json
from datetime import datetime

if __name__ == '__main__':

    #If given an argument use that as the directory, otherwise use current
    current_directory = os.getcwd() if len(sys.argv) < 2 else sys.argv[1]
    
    #If given a file by accident, use the directory that file is in
    if not os.path.isdir(current_directory):
        current_directory = os.path.dirname(current_directory)

    print (f"Parsing { current_directory }")

    files = os.listdir(current_directory)
    json_files = [file for file in files if file.endswith('_detailed_wvw_kill.json')]

    # Read each JSON file and print its contents

    datestr = datetime.now()
    participants = {}
    total = len(json_files)
    print( f"Found {total} _wvw_kill.json files")
    
    for i,json_file in enumerate(json_files):
        print( f"{i}/{total}: { json_file}" )
        try:
            with open(os.path.join(current_directory, json_file), 'r') as f:
                battle = json.load(f)
                timeStart =datetime.strptime(battle.get('timeStart').split(' ')[0], '%Y-%m-%d')
                if timeStart < datestr: datestr = timeStart
                players = battle.get('players', [])
                for player in players:
                    account = player["account"]
                    participants[account] = participants[account] + 1 if account in participants else 1
        except: 
            print(f"[!] Error parsing {json_file}")

    outfile_path = os.path.join( os.getcwd(),f"attendance_{datestr.date()}.json" )
    print (f"Output: {outfile_path}")

    with open( outfile_path, "w" ) as out:
        json.dump( {
            "total": total,
            "date": str(datestr.date()),
            "players": participants
        }, out, indent=4 )
