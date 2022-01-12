import csv

with open('lansing_missionary.csv', 'r') as file:
    mFile = csv.reader(file)

    items = []
    for row in mFile:
        rowEl = str(row[0])
        rowEl = rowEl.split(' · ')

        items.append(rowEl)

    # write to afile
    with open('lansing_miss.csv', 'w', newline='') as newFile:
        csvFile = csv.writer(newFile, delimiter=",")

        for i in items:
            csvFile.writerow(i)
        
        newFile.close()