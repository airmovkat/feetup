import Reveal from '../components/Reveal';

const AboutUs = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Reveal>
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">About FeetUp</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        We are passionate about providing the most comfortable and stylish footwear for everyone.
                    </p>
                </div>
            </Reveal>

            <Reveal delay={0.2} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                    <img
                        src="https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=1000&auto=format&fit=crop"
                        alt="About Us"
                        className="rounded-lg shadow-xl"
                    />
                </div>
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        At FeetUp, we believe that the right pair of shoes can take you places. Our mission is to combine cutting-edge design with ultimate comfort, ensuring that every step you take feels like walking on clouds.
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        Founded in 2024, we started with a simple idea: shoes shouldn't just look good, they should feel good too. We source premium materials and work with expert craftsmen to bring you footwear that stands the test of time.
                    </p>
                </div>
            </Reveal>
        </div>
    );
};

export default AboutUs;
