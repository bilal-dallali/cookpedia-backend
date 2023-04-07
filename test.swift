struct CountryView: View {
    
    @State private var searchText = ""
    @State private var selectedCountry: Country?
    
    var filteredCountries: [Country] {
        if searchText.isEmpty {
            return countryList
        } else {
            return countryList.filter { $0.name.lowercased().contains(searchText.lowercased()) }
        }
    }
    
    var body: some View {
        VStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Which country are you from? 🏳️")
                            .foregroundColor(Color("Greyscale900"))
                            .font(.custom("Urbanist-Bold", size: 32))
                        Text("Please select your country of origin for a better recommendations.")
                            .foregroundColor(Color("Greyscale900"))
                            .font(.custom("Urbanist-Regular", size: 18))
                    }
                    
                    HStack(spacing: 12) {
                        Image("magnifying-glass")
                            .padding(.leading, 20)
                        TextField("Search Country", text: $searchText)
                            .foregroundColor(Color("Greyscale900"))
                            .font(.custom("Urbanist-Regular", size: 18))
                    }
                    .frame(height: 58)
                    .background(Color("Greyscale100"))
                    .cornerRadius(16)
                    
                    VStack(spacing: 20) {
                        ForEach(filteredCountries, id: \.name) { country in
                            CountryDetailsView(country: country, selectedCountry: $selectedCountry)
                        }
                    }
                    .padding(.horizontal, 1)
                }
                .padding(.top, 40)
            }
            if selectedCountry != nil {
                NavigationLink {
                    CookingLevelView()
                    //print("Selected country: \(selectedCountry?.name ?? "None")")
                } label: {
                    Text("Continue")
                        .foregroundColor(Color("White"))
                        .font(.custom("Urbanist-Bold", size: 16))
                        .frame(maxWidth: .infinity)
                        .frame(height: 58)
                        .background(Color("Primary"))
                        .cornerRadius(.infinity)
                        .shadow(color: Color(red: 245/255, green: 72/255, blue: 74/255, opacity: 0.25), radius: 4, x: 4, y: 8)
                        .padding(.top, 24)
                        .padding(.bottom)
                }
            } else {
                Button {
                    //CookingLevelView()
                    print("Selected country: \(selectedCountry?.name ?? "None")")
                } label: {
                    Text("Continue")
                        .foregroundColor(Color("White"))
                        .font(.custom("Urbanist-Bold", size: 16))
                        .frame(maxWidth: .infinity)
                        .frame(height: 58)
                        .background(Color("DisabledButton"))
                        .cornerRadius(.infinity)
                        .padding(.top, 24)
                        .padding(.bottom)
                }
            }
            
        }
        .padding(.horizontal, 24)
        .background(Color("White"))
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                BackButtonView()
            }
            ToolbarItem(placement: .principal) {
                Image("progress-bar-22")
    }
}
